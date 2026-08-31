-- ==============================================================================
-- AGRI SHIELD — PostgreSQL + PostGIS Initialization Script
-- ==============================================================================

-- Enable Core Spatial Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable Raster Manipulation Extension (for drone orthomosaic querying)
CREATE EXTENSION IF NOT EXISTS postgis_raster;

-- Enable PostGIS Topology Support
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify PostGIS Version
DO $$
BEGIN
    RAISE NOTICE 'AGRI SHIELD PostGIS Extensions Initialized Successfully: %', postgis_full_version();
END $$;
