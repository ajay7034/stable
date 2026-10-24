<?php
namespace App\Services;
class Resume
{
    public static function extension($file): ?string
    {
        if (!$file->isValid() || $file->getSize() > 5 * 1024 * 1024) {
            return null;
        }
        $extension = strtolower($file->getClientExtension());
        $mime = $file->getMimeType();
        $head = file_get_contents($file->getTempName(), false, null, 0, 8);
        if (
            $extension === "pdf" &&
            $mime === "application/pdf" &&
            str_starts_with($head, "%PDF-")
        ) {
            return "pdf";
        }
        if (
            $extension === "doc" &&
            in_array($mime, [
                "application/msword",
                "application/CDFV2",
                "application/x-ole-storage",
            ]) &&
            $head === hex2bin("d0cf11e0a1b11ae1")
        ) {
            return "doc";
        }
        if (
            $extension !== "docx" ||
            !in_array($mime, [
                "application/zip",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ])
        ) {
            return null;
        }
        $zip = new \ZipArchive();
        if ($zip->open($file->getTempName()) !== true) {
            return null;
        }
        try {
            if (
                $zip->numFiles > 500 ||
                $zip->locateName("[Content_Types].xml") === false ||
                $zip->locateName("word/document.xml") === false
            ) {
                return null;
            }
            $size = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);
                $size += $stat["size"];
                if (
                    $size > 25 * 1024 * 1024 ||
                    preg_match("/vbaProject|\.\.\/|^\//i", $stat["name"])
                ) {
                    return null;
                }
            }
            return "docx";
        } finally {
            $zip->close();
        }
    }
}
