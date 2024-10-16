import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ChatCardWrapper from "./chatcardwrapper";
import { Chat as ChatSchema } from "@/lib/db/schema";
import { AlignLeftIcon, Building, User } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useQueryState } from "next-usequerystate";

type Props = {
  org_id: string;
  org_slug: string;
  uid: string;
  initialData: ChatSchema[];
};

export default function ChatSidebar({
  org_id,
  org_slug,
  uid,
  initialData,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger>
        <AlignLeftIcon className="text-gray-500" size={32} />
      </SheetTrigger>
      <SheetContent
        className="h-full overflow-scroll scrollbar-hide"
        side={"left"}
      >
        <div className="flex flex-col gap-y-4">
          <OrgChatToggler orgId={org_id} orgSlug={org_slug} />
          <div className="h-[calc(100vh-60px)] overflow-y-scroll scrollbar-hide ">
            <ChatCardWrapper
              org_id={org_id}
              org_slug={org_slug}
              uid={uid}
              initialData={initialData}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const OrgChatToggler = ({
  orgId,
  orgSlug,
}: {
  orgId: string;
  orgSlug: string;
}) => {
  const [cards, setCards] = useQueryState("chats");
  return (
    <div className="flex flex-col gap-y-2 items-center">
      <div>
        <div className="">
          <Tabs
            className="mx-auto"
            value={cards || "me"}
            onValueChange={(val) => {
              console.log("onvalchange", val);
              setCards(val);
            }}
          >
            <TabsList>
              <TabsTrigger value="org" className="flex gap-2 items-center">
                <Building className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">Org Chats</span>
              </TabsTrigger>
              <TabsTrigger value="me" className="flex gap-2 items-center">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Chats</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
