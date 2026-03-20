export const accountAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      { name: "assetAddresses", type: "address[]", internalType: "address[]" },
      { name: "assetIds", type: "uint256[]", internalType: "uint256[]" },
      { name: "assetAmounts", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      { name: "assetAddresses", type: "address[]", internalType: "address[]" },
      { name: "assetIds", type: "uint256[]", internalType: "uint256[]" },
      { name: "assetAmounts", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "creditor",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "numeraire",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setAssetManagers",
    inputs: [
      { name: "assetManagers", type: "address[]", internalType: "address[]" },
      { name: "statuses", type: "bool[]", internalType: "bool[]" },
      { name: "datas", type: "bytes[]", internalType: "bytes[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "flashAction",
    inputs: [
      { name: "actionTarget", type: "address", internalType: "address" },
      { name: "actionData", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
