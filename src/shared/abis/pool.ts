export const poolAbi = [
  {
    type: "function",
    name: "borrow",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "account", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "referrer", type: "bytes3", internalType: "bytes3" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "account", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
