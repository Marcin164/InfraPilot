import React, { ReactNode, useState } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import ButtonSecondary from "../../../../Components/Buttons/ButtonSecondary";
import {
  faSquare,
  faTableCellsLarge,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";

type Props = {
  children: ReactNode;
};

type Layout = "small" | "medium" | "large";

const layouts = {
  small: { 350: 1, 750: 1, 900: 1 },
  medium: { 350: 1, 750: 2, 900: 2 },
  large: { 350: 1, 750: 2, 900: 3 },
};

const PageContainer = ({ children }: Props) => {
  const [layout, setLayout] = useState<Layout>("small");

  return (
    <div className="mx-auto space-y-4">
      <div className="flex gap-2 justify-end h-[40px]">
        <ButtonSecondary icon={faSquare} onClick={() => setLayout("small")} />
        <ButtonSecondary
          icon={faTableCellsLarge}
          onClick={() => setLayout("medium")}
        />
        <ButtonSecondary
          icon={faTableCells}
          onClick={() => setLayout("large")}
        />
      </div>

      <ResponsiveMasonry columnsCountBreakPoints={layouts[layout]}>
        <Masonry>{children}</Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default PageContainer;
