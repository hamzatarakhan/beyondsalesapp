import { useState } from "react";
import { IdCard, Store, UserCog, Mail, MapPin, Phone, Eye, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type RoleKey = "regionalManager" | "teamLeader" | "accountManager" | "salesPartner" | "salesPromoter";

interface Member {
  id: string;
  name: string;
  initials: string;
  roleKey: RoleKey;
  channel: string;
  isMe?: boolean;
  memberCode: string;
  channelType: string;
  email: string;
  phone: string;
  locations: { name: string; address: string }[];
  children?: Member[];
}

// Prototype-only static org tree — no employee backend to source this from yet.
const makeMember = (overrides: Partial<Member> & Pick<Member, "id" | "name" | "initials" | "roleKey">): Member => ({
  channel: "Modern Trade",
  memberCode: "MC-000123",
  channelType: "Direct Sales",
  email: "example@email.com",
  phone: "0789253789",
  locations: [
    { name: "Location (1)", address: "Address" },
    { name: "Location (2)", address: "Address" },
    { name: "Location (3)", address: "Address" },
  ],
  ...overrides,
});

const ROOT: Member = makeMember({
  id: "rm",
  name: "Regional Manager Name",
  initials: "RM",
  roleKey: "regionalManager",
  isMe: true,
  children: [
    makeMember({
      id: "tl",
      name: "Team Leader Name",
      initials: "TL",
      roleKey: "teamLeader",
      children: [
        makeMember({ id: "sc1", name: "Sales Champion 1", initials: "SC", roleKey: "salesPartner" }),
        makeMember({ id: "sc2", name: "Sales Champion 2", initials: "SC", roleKey: "salesPartner" }),
      ],
    }),
    makeMember({
      id: "am",
      name: "Account Manager 1",
      initials: "AM",
      roleKey: "accountManager",
      children: [
        makeMember({
          id: "sp1",
          name: "Sales Partner 1",
          initials: "SP",
          roleKey: "salesPartner",
          children: [
            makeMember({ id: "spr1", name: "Sales Promoter 1", initials: "SP", roleKey: "salesPromoter" }),
            makeMember({ id: "spr2", name: "Sales Promoter 2", initials: "SP", roleKey: "salesPromoter" }),
          ],
        }),
        makeMember({ id: "sp2", name: "Sales Partner 2", initials: "SP", roleKey: "salesPartner" }),
      ],
    }),
  ],
});

const MemberRow = ({
  member,
  highlighted,
  bare,
  roleLabel,
  meLabel,
  viewDetailsLabel,
  onSelect,
  onDetails,
}: {
  member: Member;
  highlighted: boolean;
  bare?: boolean;
  roleLabel: string;
  meLabel: string;
  viewDetailsLabel: string;
  onSelect: () => void;
  onDetails: () => void;
}) => (
  <div
    className={cn(
      "w-full flex items-center gap-2 p-3",
      bare ? "bg-transparent" : cn("rounded-2xl bg-card shadow-sm", highlighted ? "!border-2 !border-primary" : "border border-border/60"),
    )}
  >
    <button type="button" onClick={onSelect} className="flex items-center gap-3 flex-1 min-w-0 text-start">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
        {member.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
          {member.isMe && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-semibold shrink-0">
              {meLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {roleLabel} · {member.channel}
        </p>
      </div>
    </button>
    <button
      type="button"
      onClick={onDetails}
      aria-label={viewDetailsLabel}
      className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
    >
      <IdCard className="w-4 h-4 text-primary" />
    </button>
  </div>
);

const Connector = () => (
  <div className="pl-8">
    <span className="block w-px h-3 bg-border" />
  </div>
);

const DetailRow = ({
  icon: Icon,
  label,
  value,
  trailing,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
    {trailing}
  </div>
);

const MyHierarchy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [path, setPath] = useState<Member[]>([ROOT]);
  const [view, setView] = useState<"tree" | "details">("tree");
  const [detailsMember, setDetailsMember] = useState<Member>(ROOT);
  const [locationOpen, setLocationOpen] = useState(false);

  const focused = path[path.length - 1];

  const openDetails = (member: Member) => {
    setDetailsMember(member);
    setView("details");
  };

  const selectNode = (member: Member) => {
    const idxInPath = path.findIndex((m) => m.id === member.id);
    if (idxInPath !== -1) {
      setPath(path.slice(0, idxInPath + 1));
      return;
    }
    if (member.children && member.children.length > 0) {
      setPath([...path, member]);
    } else {
      openDetails(member);
    }
  };

  const handleBack = () => {
    if (view === "details") {
      setView("tree");
      return;
    }
    if (path.length > 1) {
      setPath(path.slice(0, -1));
      return;
    }
    navigate("/profile");
  };

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader
        title={view === "details" ? t("profile.hierarchy.detailsTitle") : t("profile.hierarchy.title")}
        showBack
        onBackClick={handleBack}
      />

      {view === "tree" ? (
        <div className="px-4 mt-2">
          {path.map((member, i) => (
            <div key={member.id}>
              <MemberRow
                member={member}
                highlighted
                roleLabel={t(`profile.hierarchy.roles.${member.roleKey}`)}
                meLabel={t("profile.hierarchy.me")}
                viewDetailsLabel={t("profile.hierarchy.viewDetails")}
                onSelect={() => selectNode(member)}
                onDetails={() => openDetails(member)}
              />
              {(i < path.length - 1 || (focused.children && focused.children.length > 0)) && <Connector />}
            </div>
          ))}
          {focused.children && focused.children.length > 0 && (
            <div className="rounded-2xl bg-card shadow-sm border border-border/60 divide-y divide-border">
              {focused.children.map((child) => (
                <MemberRow
                  key={child.id}
                  member={child}
                  highlighted={false}
                  bare
                  roleLabel={t(`profile.hierarchy.roles.${child.roleKey}`)}
                  meLabel={t("profile.hierarchy.me")}
                  viewDetailsLabel={t("profile.hierarchy.viewDetails")}
                  onSelect={() => selectNode(child)}
                  onDetails={() => openDetails(child)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 mt-2 space-y-4">
          <div className="bg-card rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-base font-semibold text-primary">
              {detailsMember.initials}
            </div>
            <p className="text-base font-semibold text-foreground mt-3">{detailsMember.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("profile.hierarchy.memberCode")}: {detailsMember.memberCode}
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-sm p-4">
            <DetailRow icon={Store} label={t("profile.hierarchy.channelType")} value={detailsMember.channelType} />
            <DetailRow
              icon={UserCog}
              label={t("profile.hierarchy.userType")}
              value={t(`profile.hierarchy.roles.${detailsMember.roleKey}`)}
            />
            <DetailRow icon={Mail} label={t("profile.hierarchy.email")} value={detailsMember.email} />
            <DetailRow
              icon={MapPin}
              label={t("profile.hierarchy.location")}
              value={detailsMember.locations.map((l) => l.name).join(", ")}
              trailing={
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  aria-label={t("profile.hierarchy.location")}
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                >
                  <Eye className="w-4 h-4 text-primary" />
                </button>
              }
            />
            <DetailRow icon={Phone} label={t("profile.hierarchy.phoneNumber")} value={detailsMember.phone} />
          </div>
        </div>
      )}

      <BottomNav />

      <Drawer open={locationOpen} onOpenChange={setLocationOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="w-9" />
            <h3 className="text-lg font-bold text-foreground">{t("profile.hierarchy.location")}</h3>
            <button
              onClick={() => setLocationOpen(false)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="space-y-4 pb-2">
            {detailsMember.locations.map((loc) => (
              <div key={loc.name} className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MyHierarchy;
