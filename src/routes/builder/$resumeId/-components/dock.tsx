import { t } from "@lingui/core/macro";
import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CircleNotchIcon,
  CubeFocusIcon,
  FileDocIcon,
  FileJsIcon,
  FilePdfIcon,
  type Icon,
  LinkSimpleIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useCallback, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useControls } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

import { useTemporalStore } from "@/components/resume/store/resume";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useResumeExport } from "@/hooks/use-resume-export";
import { authClient } from "@/integrations/auth/client";
import { orpc } from "@/integrations/orpc/client";
import { cn } from "@/utils/style";

export function BuilderDock() {
  const { data: session } = authClient.useSession();
  const params = useParams({ from: "/builder/$resumeId" });

  const [_, copyToClipboard] = useCopyToClipboard();
  const { zoomIn, zoomOut, centerView } = useControls();

  const { data: resume } = useQuery(orpc.resume.getById.queryOptions({ input: { id: params.resumeId } }));
  const {
    downloadJSON,
    downloadDOCX,
    downloadPDF,
    isPending: exportPending,
  } = useResumeExport({ resume: resume ?? null });

  const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    pastStates: state.pastStates,
    futureStates: state.futureStates,
  }));

  const canUndo = pastStates.length > 1;
  const canRedo = futureStates.length > 0;

  useHotkeys("mod+z", () => undo(), { enabled: canUndo, preventDefault: true });
  useHotkeys(["mod+y", "mod+shift+z"], () => redo(), { enabled: canRedo, preventDefault: true });

  const publicUrl = useMemo(() => {
    if (!session?.user.username || !resume?.slug) return "";
    return `${window.location.origin}/${session.user.username}/${resume.slug}`;
  }, [session?.user.username, resume?.slug]);

  const onCopyUrl = useCallback(async () => {
    await copyToClipboard(publicUrl);
    toast.success(t`A link to your resume has been copied to clipboard.`);
  }, [publicUrl, copyToClipboard]);

  return (
    <div className="fixed inset-x-0 bottom-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 0.6, y: 0 }}
        whileHover={{ opacity: 1, y: -2, scale: 1.01 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }}
        className="flex items-center rounded-l-full rounded-r-full bg-popover px-2 shadow-xl"
      >
        <DockIcon
          disabled={!canUndo}
          onClick={() => undo()}
          icon={ArrowUUpLeftIcon}
          title={t({
            context: "'Ctrl' may be replaced with the locale-specific equivalent (e.g. 'Strg' for QWERTZ layouts).",
            message: "Undo (Ctrl+Z)",
          })}
        />
        <DockIcon
          disabled={!canRedo}
          onClick={() => redo()}
          icon={ArrowUUpRightIcon}
          title={t({
            context: "'Ctrl' may be replaced with the locale-specific equivalent (e.g. 'Strg' for QWERTZ layouts).",
            message: "Redo (Ctrl+Y)",
          })}
        />
        <div className="mx-1 h-8 w-px bg-border" />
        <DockIcon icon={MagnifyingGlassPlusIcon} title={t`Zoom in`} onClick={() => zoomIn(0.1)} />
        <DockIcon icon={MagnifyingGlassMinusIcon} title={t`Zoom out`} onClick={() => zoomOut(0.1)} />
        <DockIcon icon={CubeFocusIcon} title={t`Center view`} onClick={() => centerView()} />
        <div className="mx-1 h-8 w-px bg-border" />
        <DockIcon icon={LinkSimpleIcon} title={t`Copy URL`} onClick={() => onCopyUrl()} />
        <DockIcon
          icon={FileJsIcon}
          title={t`Download JSON`}
          disabled={exportPending.json}
          onClick={() => void downloadJSON()}
        />
        <DockIcon
          icon={FileDocIcon}
          title={t`Download DOCX`}
          disabled={exportPending.docx}
          onClick={() => void downloadDOCX()}
        />
        <DockIcon
          title={t`Download PDF`}
          disabled={exportPending.pdf}
          onClick={() => void downloadPDF()}
          icon={exportPending.pdf ? CircleNotchIcon : FilePdfIcon}
          iconClassName={cn(exportPending.pdf && "animate-spin")}
        />
      </motion.div>
    </div>
  );
}

type DockIconProps = {
  title: string;
  icon: Icon;
  disabled?: boolean;
  onClick: () => void;
  iconClassName?: string;
};

function DockIcon({ icon: Icon, title, disabled, onClick, iconClassName }: DockIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.div
            whileHover={disabled ? undefined : { y: -1, scale: 1.04 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ willChange: "transform" }}
          >
            <Button size="icon" variant="ghost" disabled={disabled} onClick={onClick}>
              <Icon className={cn("size-4", iconClassName)} />
            </Button>
          </motion.div>
        }
      />

      <TooltipContent side="top" align="center" className="font-medium">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}
