import { t } from "@lingui/core/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { ResumeData } from "@/schema/resume/data";

import { orpc } from "@/integrations/orpc/client";
import { downloadFromUrl, downloadWithAnchor, generateFilename } from "@/utils/file";
import { buildDocx } from "@/utils/resume/docx";

type ResumeExportSource = {
  id: string;
  name: string;
  data?: ResumeData;
} | null;

type ResumeWithData = {
  id: string;
  name: string;
  data: ResumeData;
};

type UseResumeExportOptions = {
  resume: ResumeExportSource;
};

type UseResumeExportResult = {
  downloadJSON: () => Promise<void>;
  downloadDOCX: () => Promise<void>;
  downloadPDF: () => Promise<void>;
  isPending: {
    json: boolean;
    docx: boolean;
    pdf: boolean;
  };
};

const PDF_LOADING_MESSAGE = t`Please wait while your PDF is being generated...`;
const PDF_LOADING_DESCRIPTION = t`This may take a while depending on the server capacity. Please do not close the window or refresh the page.`;
const PDF_ERROR_MESSAGE = t`There was a problem while generating the PDF, please try again in some time.`;
const DOCX_ERROR_MESSAGE = t`There was a problem while generating the DOCX, please try again.`;
const JSON_ERROR_MESSAGE = t`There was a problem while generating the JSON, please try again.`;

export function useResumeExport({ resume }: UseResumeExportOptions): UseResumeExportResult {
  const queryClient = useQueryClient();
  const resumeId = resume?.id;
  const resumeName = resume?.name;
  const resumeData = resume?.data;

  const [cachedResume, setCachedResume] = useState<ResumeWithData | null>(
    resumeId && resumeName && resumeData ? { id: resumeId, name: resumeName, data: resumeData } : null,
  );

  useEffect(() => {
    if (!resumeId || !resumeName) {
      setCachedResume(null);
      return;
    }

    if (resumeData) {
      setCachedResume({ id: resumeId, name: resumeName, data: resumeData });
      return;
    }

    setCachedResume((previous) => {
      if (!previous || previous.id !== resumeId) {
        return null;
      }

      return previous;
    });
  }, [resumeId, resumeName, resumeData]);

  const ensureResumeWithData = useCallback(async (): Promise<ResumeWithData | null> => {
    if (!resumeId || !resumeName) return null;

    if (resumeData) {
      return { id: resumeId, name: resumeName, data: resumeData };
    }

    if (cachedResume && cachedResume.id === resumeId) {
      return cachedResume;
    }

    const response = await queryClient.ensureQueryData(orpc.resume.getById.queryOptions({ input: { id: resumeId } }));
    const normalized: ResumeWithData = { id: response.id, name: response.name, data: response.data };

    setCachedResume(normalized);
    return normalized;
  }, [cachedResume, queryClient, resumeData, resumeId, resumeName]);

  const jsonMutation = useMutation({
    mutationFn: async () => {
      const exportableResume = await ensureResumeWithData();
      if (!exportableResume) return;

      const filename = generateFilename(exportableResume.name, "json");
      const jsonString = JSON.stringify(exportableResume.data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      downloadWithAnchor(blob, filename);
    },
    onError: () => {
      toast.error(JSON_ERROR_MESSAGE);
    },
  });

  const docxMutation = useMutation({
    mutationFn: async () => {
      const exportableResume = await ensureResumeWithData();
      if (!exportableResume) return;

      const filename = generateFilename(exportableResume.name, "docx");
      const blob = await buildDocx(exportableResume.data);

      downloadWithAnchor(blob, filename);
    },
    onError: () => {
      toast.error(DOCX_ERROR_MESSAGE);
    },
  });

  const { mutateAsync: printResumeAsPDF, isPending: isPrinting } = useMutation(
    orpc.printer.printResumeAsPDF.mutationOptions(),
  );

  const downloadPDF = useCallback(async () => {
    if (!resumeId || !resumeName) return;

    const filename = generateFilename(resumeName, "pdf");
    const toastId = toast.loading(PDF_LOADING_MESSAGE, { description: PDF_LOADING_DESCRIPTION });

    try {
      const { url } = await printResumeAsPDF({ id: resumeId });
      await downloadFromUrl(url, filename);
    } catch {
      toast.error(PDF_ERROR_MESSAGE);
    } finally {
      toast.dismiss(toastId);
    }
  }, [resumeId, resumeName, printResumeAsPDF]);

  const downloadJSON = useCallback(async () => {
    await jsonMutation.mutateAsync();
  }, [jsonMutation]);

  const downloadDOCX = useCallback(async () => {
    await docxMutation.mutateAsync();
  }, [docxMutation]);

  return {
    downloadJSON,
    downloadDOCX,
    downloadPDF,
    isPending: {
      json: jsonMutation.isPending,
      docx: docxMutation.isPending,
      pdf: isPrinting,
    },
  };
}
