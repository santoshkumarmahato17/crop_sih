#!/bin/sh
# MinIO Storage Bucket Initialization Script for AGRI SHIELD

/usr/bin/mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

/usr/bin/mc mb local/agrishield-raw-imagery --ignore-existing
/usr/bin/mc mb local/agrishield-orthomosaics --ignore-existing
/usr/bin/mc mb local/agrishield-index-rasters --ignore-existing
/usr/bin/mc mb local/agrishield-model-artifacts --ignore-existing

echo "AGRI SHIELD MinIO Storage Buckets Provisioned Successfully."
