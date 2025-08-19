import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PatentNFTModule", (m) => {
  const patentNFT = m.contract("PatentNFT");

  return { patentNFT };
});