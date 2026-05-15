<?php

declare(strict_types=1);

namespace App\Service;

use Aws\S3\S3Client;
use League\Flysystem\FilesystemOperator;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileUploadService
{
    public function __construct(
        private readonly FilesystemOperator $defaultStorage,
        private readonly S3Client $awsS3Client,
        private readonly string $awsRegion,
        private readonly string $awsBucket,
    ) {}

    /**
     * Upload a file to S3 via Flysystem and return the stored path (never a public URL).
     */
    public function upload(UploadedFile $file, string $directory): string
    {
        $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $originalFilename);
        $extension = $file->guessExtension() ?? $file->getClientOriginalExtension();
        $uniqueFilename = sprintf('%s/%s_%s.%s', rtrim($directory, '/'), $safeFilename, bin2hex(random_bytes(8)), $extension);

        $stream = fopen($file->getRealPath(), 'rb');
        if ($stream === false) {
            throw new \RuntimeException('Cannot open uploaded file for reading.');
        }

        try {
            $this->defaultStorage->writeStream($uniqueFilename, $stream, [
                'ContentType' => $file->getMimeType() ?? 'application/octet-stream',
            ]);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        return $uniqueFilename;
    }

    /**
     * Generate a pre-signed URL for a given S3 path with specified TTL in seconds.
     */
    public function getSignedUrl(string $path, int $ttl = 3600): string
    {
        $command = $this->awsS3Client->getCommand('GetObject', [
            'Bucket' => $this->awsBucket,
            'Key'    => 'artisan-portal/' . ltrim($path, '/'),
        ]);

        $presignedRequest = $this->awsS3Client->createPresignedRequest($command, sprintf('+%d seconds', $ttl));

        return (string) $presignedRequest->getUri();
    }

    /**
     * Delete a file from S3 storage.
     */
    public function delete(string $path): void
    {
        if ($this->defaultStorage->fileExists($path)) {
            $this->defaultStorage->delete($path);
        }
    }

    /**
     * Check if a file exists in storage.
     */
    public function exists(string $path): bool
    {
        return $this->defaultStorage->fileExists($path);
    }
}
