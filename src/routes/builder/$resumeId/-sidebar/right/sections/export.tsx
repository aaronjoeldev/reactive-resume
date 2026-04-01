import { Trans } from "@lingui/react/macro";
import { CircleNotchIcon, FileDocIcon, FileJsIcon, FilePdfIcon } from "@phosphor-icons/react";

import { useResumeStore } from "@/components/resume/store/resume";
import { Button } from "@/components/ui/button";
import { useResumeExport } from "@/hooks/use-resume-export";

import { SectionBase } from "../shared/section-base";

export function ExportSectionBuilder() {
  const resume = useResumeStore((state) => state.resume);
  const { downloadJSON, downloadDOCX, downloadPDF, isPending } = useResumeExport({ resume });

  return (
    <SectionBase type="export" className="space-y-4">
      <Button
        variant="outline"
        disabled={isPending.json}
        onClick={() => void downloadJSON()}
        className="h-auto gap-x-4 p-4! text-start font-normal whitespace-normal active:scale-98"
      >
        {isPending.json ? (
          <CircleNotchIcon className="size-6 shrink-0 animate-spin" />
        ) : (
          <FileJsIcon className="size-6 shrink-0" />
        )}
        <div className="flex flex-1 flex-col gap-y-1">
          <h6 className="font-medium">JSON</h6>
          <p className="text-xs leading-normal text-muted-foreground">
            <Trans>
              Download a copy of your resume in JSON format. Use this file for backup or to import your resume into
              other applications, including AI assistants.
            </Trans>
          </p>
        </div>
      </Button>

      <Button
        variant="outline"
        disabled={isPending.docx}
        onClick={() => void downloadDOCX()}
        className="h-auto gap-x-4 p-4! text-start font-normal whitespace-normal active:scale-98"
      >
        {isPending.docx ? (
          <CircleNotchIcon className="size-6 shrink-0 animate-spin" />
        ) : (
          <FileDocIcon className="size-6 shrink-0" />
        )}
        <div className="flex flex-1 flex-col gap-y-1">
          <h6 className="font-medium">DOCX</h6>
          <p className="text-xs leading-normal text-muted-foreground">
            <Trans>
              Download a copy of your resume as a Word document. Use this file to further customize your resume in
              Microsoft Word or Google Docs.
            </Trans>
          </p>
        </div>
      </Button>

      <Button
        variant="outline"
        disabled={isPending.pdf}
        onClick={() => void downloadPDF()}
        className="h-auto gap-x-4 p-4! text-start font-normal whitespace-normal active:scale-98"
      >
        {isPending.pdf ? (
          <CircleNotchIcon className="size-6 shrink-0 animate-spin" />
        ) : (
          <FilePdfIcon className="size-6 shrink-0" />
        )}

        <div className="flex flex-1 flex-col gap-y-1">
          <h6 className="font-medium">PDF</h6>
          <p className="text-xs leading-normal text-muted-foreground">
            <Trans>
              Download a copy of your resume in PDF format. Use this file for printing or to easily share your resume
              with recruiters.
            </Trans>
          </p>
        </div>
      </Button>
    </SectionBase>
  );
}
