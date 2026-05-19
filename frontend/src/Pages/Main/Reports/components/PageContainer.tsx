import React, { ReactNode } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import ButtonPrimary from "../../../../Components/Buttons/ButtonPrimary";
import {
  faSquare,
  faTableCellsLarge,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserSettings,
  updateUserSettings,
} from "../../../../Services/settings";
import { twMerge } from "tailwind-merge";

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
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: getUserSettings,
  });

  const layout: Layout = (settings?.reportsLayout as Layout) || "small";

  const mutation = useMutation({
    mutationFn: (newLayout: Layout) =>
      updateUserSettings({ reportsLayout: newLayout }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    },
  });

  const btnClass = (value: Layout) =>
    twMerge(
      value === layout &&
        "ring-2 ring-white ring-offset-2 ring-offset-blue-500",
    );

  return (
    <div className="mx-auto space-y-4">
      <div className="hidden sm:flex gap-2 justify-end h-[40px]">
        <ButtonPrimary
          color="white"
          icon={faSquare}
          className={btnClass("small")}
          onClick={() => mutation.mutate("small")}
        />
        <ButtonPrimary
          color="white"
          icon={faTableCellsLarge}
          className={btnClass("medium")}
          onClick={() => mutation.mutate("medium")}
        />
        <ButtonPrimary
          color="white"
          icon={faTableCells}
          className={btnClass("large")}
          onClick={() => mutation.mutate("large")}
        />
      </div>

      <ResponsiveMasonry columnsCountBreakPoints={layouts[layout]}>
        <Masonry>{children}</Masonry>
      </ResponsiveMasonry>
    </div>
  );
};

export default PageContainer;
