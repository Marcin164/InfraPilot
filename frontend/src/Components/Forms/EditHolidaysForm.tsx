import React, { useState } from "react";
import Calendar from "../Calendar/Calendar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthInfo } from "@propelauth/react";
import { deleteCalendarHoliday, postCalendarHoliday } from "../../Services/sla";
import { isSameDay } from "../../Helpers/date";

type Props = {
  calendarId: string;
  holidayDates: any[];
};

const EditHolidaysForm = ({ calendarId, holidayDates }: Props) => {
  const { accessToken } = useAuthInfo();
  const queryClient = useQueryClient();

  const [holidays, setHolidays] = useState<Date[]>(
    holidayDates && holidayDates.map((h) => new Date(h.date)),
  );

  const addHolidayMutation = useMutation({
    mutationFn: (date: Date) =>
      postCalendarHoliday(accessToken, {
        id: calendarId,
        date: date,
        description: "",
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendars"],
      });
    },
  });

  const removeHolidayMutation = useMutation({
    mutationFn: (holidayId: string) =>
      deleteCalendarHoliday(accessToken, holidayId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendars"],
      });
    },
  });

  const handleHolidaysSelection = (selected?: Date[]) => {
    if (!selected) return;

    const added = selected.find((d) => !holidays.some((h) => isSameDay(h, d)));

    const removed = holidays.find(
      (h) => !selected.some((d) => isSameDay(h, d)),
    );

    if (added) addHolidayMutation.mutate(added);
    if (removed) {
      const holiday = holidayDates.find((h) => h.date === removed);
      if (holiday) removeHolidayMutation.mutate(holiday.id);
    }

    setHolidays(selected);
  };

  return <Calendar holidays={holidays} onChange={handleHolidaysSelection} />;
};

export default EditHolidaysForm;
