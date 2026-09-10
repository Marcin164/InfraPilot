import React from 'react'

type Props = {
    name:string
    surname: string
    title: string
}

const AgentCell = ({name, surname, title}: Props) => {
  return (
          <div className="min-w-[200px] h-full flex flex-col items-center justify-center">
        <span className="text-[#2B9AE9] text-[16px] font-bold">{`${name} ${surname}`}</span>
        <span className="text-[12px] text-[#535353] font-light">{title}</span>
      </div>
  )
}

export default AgentCell