"use client";

import { Chat } from "@/lib/db/schema";
import { ChatEntry } from "@/lib/types";
import { ChatLog } from "@/lib/types";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
// import { Button, buttonVariants } from "./button";
// import { Popover } from "./popover";
// import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
interface Props {
  chat?: Chat;
  chatLive?: ChatEntry[];
  allPresenceIds?: Array<string>;
}

interface UserAvatarData {
  id: string;
  img: string;
}

const Chatusersavatars = ({ chat, chatLive, allPresenceIds }: Props) => {
  const [users, setUsers] = useState<Array<UserAvatarData>>(
    [] as UserAvatarData[],
  );

  const getUsers = async (ids: Array<string>) => {
    const users = await fetch("/api/getUsers", {
      method: "POST",
      body: JSON.stringify({ ids: ids }),
    });
    const data = await users.json();
    setUsers(data.users);
  };

  useEffect(() => {
    if (chat && chat.messages !== null) {
      const chatArray = (JSON.parse(chat.messages as string) as ChatLog)?.log;
      const ids = getUserIdList(chatArray);
      if (ids.length) {
        getUsers(ids);
      }
    }
    if (chatLive) {
      const ids = getUserIdList(chatLive);
      // include ids of users who have not participated in the chat but viewing the chat
      const viewersIds = allPresenceIds?.filter((id) => !ids?.includes(id));
      if (ids.length) {
        if (viewersIds) {
          getUsers([...ids, ...viewersIds]);
        } else {
          getUsers([...ids]);
        }
      }
    }
  }, [chat, chatLive?.length, allPresenceIds?.length]);

  return (
    <div className="flex">
      {users.length > 0 ? (
        users.length === 1 ? (
          // handle first user and other seperately
          users.map((user) => (
            <Avatar
              className={`mr-2 w-9 h-9 ${
                allPresenceIds
                  ? allPresenceIds.includes(user.id)
                    ? "border-2 border-green-600"
                    : ""
                  : null
              }`}
              key={user.id}
            >
              <AvatarImage src={user?.img} alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          ))
        ) : (
          <div className="flex">
            {
              <Avatar
                className={`mr-2 w-9 h-9 ${
                  allPresenceIds
                    ? allPresenceIds.includes(users[0].id)
                      ? "border-2 border-green-600"
                      : ""
                    : null
                }`}
                key={users[0]?.id}
              >
                <AvatarImage src={users[0]?.img} alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            }
            <div className="ml-2 flex">
              {users.slice(1, 4).map((user) => (
                <Avatar
                  className={` -ml-2 w-9 h-9 ${
                    allPresenceIds
                      ? allPresenceIds.includes(user.id)
                        ? "border-2 border-green-600"
                        : ""
                      : null
                  } `}
                  key={user.id}
                >
                  <AvatarImage src={user?.img} alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              ))}
            </div>
            {/* <Popover>
              <PopoverTrigger>
                <Button className={buttonVariants({ variant: "secondary" })}>
                  Others
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-2 py-1 tracking-tighter">
                  {users.slice(1).map((user) => (
                    <Avatar className=" -ml-1 w-9 h-9" key={user.id}>
                      <AvatarImage src={user?.img} alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </PopoverContent>
            </Popover> */}
          </div>
        )
      ) : null}
    </div>
  );
};

export default Chatusersavatars;

export const getChatCreator = (chatMessages: string): string => {
  const firstEntry = (JSON.parse(chatMessages as string) as ChatLog)?.log[0];
  const creator = firstEntry.name
    ? firstEntry.name.split(",")[0]
    : "Unknown Creator";
  return creator;
};

export const getUserIdList = (chatMessages: ChatEntry[]): Array<string> => {
  // const chatArray = (JSON.parse(chatMessages as string) as ChatLog)?.log;
  const ArrayContainingUsers = chatMessages.filter((chat) =>
    chat.name !== "" ? chat.name : null,
  );
  const ids = ArrayContainingUsers.map((usr) => {
    const split = usr.name.split(",");
    return split.length > 0 ? split[1] : null;
  });
  const filteredIds = ids.filter((id) => id !== undefined);
  const uniqueIds = Array.from(new Set(filteredIds));
  return uniqueIds as Array<string>;
};
