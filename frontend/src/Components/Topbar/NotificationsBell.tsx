import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  listNotifications,
  unreadNotificationCount,
  markNotificationsRead,
  markAllNotificationsRead,
  Notification,
} from "../../Services/notifications";

const NotificationsBell = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const countQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: unreadNotificationCount,
    refetchInterval: 30000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => listNotifications(false, 30),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.readAt) markReadMutation.mutate([n.id]);
    setOpen(false);
    if (n.url) navigate(n.url);
  };

  const count = countQuery.data ?? 0;
  const items = listQuery.data ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-[36px] w-[36px] rounded-full hover:bg-[#F0F0F0] flex items-center justify-center cursor-pointer"
        title="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="text-[#535353]" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F3606E] text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[42px] z-50 w-[380px] max-h-[500px] overflow-auto rounded-[10px] bg-white shadow-xl border border-[#EFEFEF]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#F0F0F0]">
            <span className="font-bold text-[14px]">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="text-[12px] text-[#2B9AE9] hover:underline cursor-pointer"
              >
                mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-[#7a7a7a] text-center">
              No notifications.
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`block w-full text-left px-4 py-2 hover:bg-[#F5F5F5] border-b border-[#F5F5F5] cursor-pointer ${
                  !n.readAt ? "bg-[#F0F8FE]" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && (
                    <span className="mt-1.5 w-[6px] h-[6px] rounded-full bg-[#2B9AE9] shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-[#3C3C3C] truncate">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-[12px] text-[#535353] line-clamp-2">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[11px] text-[#9a9a9a] mt-0.5">
                      {moment(n.createdAt).fromNow()}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
