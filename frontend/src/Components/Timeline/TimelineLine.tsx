import React from "react";
import TimelineDot from "./TimelineDot";
import TimelineItem from "./TimelineItem";

type Props = { items: any };

const TimelineLine = ({ items }: Props) => {
  return (
    <div className="border-l-[1px] border-[#2B9AE9] relative h-fit pb-2">
      {items.map((item: any) => {
        return (
          <>
            <TimelineDot />
            <TimelineItem {...item} />
          </>
        );
      })}
    </div>
  );
};

export default TimelineLine;
