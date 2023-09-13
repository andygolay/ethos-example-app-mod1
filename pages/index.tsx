import type { NextPage } from "next";
import Link from 'next/link';
import { SignInButton, ethos } from "ethos-connect";
import { useCallback, useState } from "react";

const Home: NextPage = () => {
  const contractAddress = "0x0000000000000000000000000000000000000002";
  const { status, wallet } = ethos.useWallet();

  const [funding, setFunding] = useState(false);
  const [fundingSuccess, setFundingSuccess] = useState(false);
  const [fundingError, setFundingError] = useState(false);
  const [nftObjectId, setNftObjectId] = useState(null);

  const fund = useCallback(async () => {
    if (!wallet || funding) return;

    setFunding(true);
    setFundingError(false);
    try {
        await ethos.dripSui({ address: wallet.address });
        setFundingSuccess(true);
    } catch (e) {
        console.log("Error", e)
        setFundingError(true);
    }
    setFunding(false);
  }, [wallet, funding]);

  const mint = useCallback(async () => {
    if (!wallet) return;

    try {
      const signableTransaction = {
        kind: "moveCall" as const,
        data: {
          packageObjectId: contractAddress,
          module: "devnet_nft",
          function: "mint",
          typeArguments: [],
          arguments: [
            "Ethos Example NFT",
            "A sample NFT from Ethos Wallet.",
            "https://ethoswallet.xyz/assets/images/ethos-email-logo.png",
          ],
          gasBudget: 10000,
        },
      };

      const response = await wallet.signAndExecuteTransaction(signableTransaction);
      if (response?.effects?.events) {
        const { moveEvent } = response.effects.events.find((e) => e.moveEvent);
        setNftObjectId(moveEvent.fields.object_id)
      }  
    } catch (error) {
      console.log(error);
    }
  }, [wallet]);

  const reset = useCallback(() => {
    setFundingError(false);
    setFundingSuccess(false);
    setNftObjectId(null);
  }, []);

  const disconnect = useCallback(() => {
    reset();
    wallet?.disconnect();
  }, [reset, wallet])

  return (
    <div className="flex justify-between items-start">
      <div className="p-12 flex-1">Status: {status}</div>

      <div className="max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8 flex-6">
        {!wallet ? (
          <SignInButton className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Connect
          </SignInButton>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Connected to wallet
              </h2>
              <code>{wallet.address}</code>
              <div className="place-content-center text-base font-medium text-ethos-primary space-x-1">
                <div>
                  Wallet balance: <code>{wallet.contents?.suiBalance}</code>{" "}
                  Mist
                </div>
                <div className="text-xs text-gray-500">
                  (1 sui is 10^9 Mist)
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {fundingError && (
                <div className='p-3 bg-red-200 text-sm text-center relative'>
                  <div 
                    className='cursor-pointer rounded-full flex justify-center items-center bg-white w-6 h-6 text-sm absolute top-3 right-3'
                    onClick={reset}
                  >
                    ✕
                  </div>
                  The faucet did not work. Please try again in a little bit.
                </div>
              )}
              First, fund this wallet from the Sui faucet:
              {fundingSuccess && (
                <div className='p-3 bg-green-200 text-sm text-center relative'>
                    <div 
                        className='cursor-pointer rounded-full flex justify-center items-center bg-white w-6 h-6 text-sm absolute top-3 right-3'
                        onClick={reset}
                    >
                        ✕
                    </div>
                    <b>Success!</b>
                    &nbsp; &nbsp;
                    Your new balance is {wallet.contents?.suiBalance} Mist!
                </div>
              )}
              <button
                className="mx-auto px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={fund}
              >
                {funding ? <>Funding...</> : <>Fund</>}
              </button>
              then
              {nftObjectId && (
                <div className='p-3 bg-green-200 text-sm text-center relative'>
                    <div 
                        className='cursor-pointer rounded-full flex justify-center items-center bg-white w-6 h-6 text-sm absolute top-3 right-3'
                        onClick={reset}
                    >
                        ✕
                    </div>
                    <b>Success!</b>
                    &nbsp; &nbsp;
                    <a 
                        href={`https://explorer.devnet.sui.io/objects/${nftObjectId}`}
                        target="_blank" 
                        rel="noreferrer"
                        className='underline font-blue-600' 
                    >
                        View Your NFT on the DevNet Explorer 
                    </a>
                </div>
              )}
              <Link href="/mint">
                <button
                  className="mx-auto px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Mint an NFT
                </button>
              </Link>
              or
              <button
                className="mx-auto px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={disconnect}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-12 flex-1 flex justify-end">
        <ethos.components.AddressWidget />
      </div>
    </div>
  );
};

export default Home;
