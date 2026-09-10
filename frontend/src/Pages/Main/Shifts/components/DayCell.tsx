import React from 'react'

type Props = {
    day: string
    date:string
    width: number
}

const DayCell = ({day, date, width}: Props) => {
  return (
        <div style={{width}} className="h-[50px] flex flex-col items-center justify-center border-[#F6F6F6] border-l-3 border-box shrink-0">
            <span className="text-[#2B9AE9] text-[16px] font-bold">{day}</span>
            <span className="text-[10px] text-[#535353] font-light">{date}</span>
        </div>
  )
}

export default DayCell