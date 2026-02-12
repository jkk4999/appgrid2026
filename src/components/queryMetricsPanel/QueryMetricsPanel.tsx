import React from 'react';

// NEW: Domain-specific selector hooks
import { useQueryState } from '../../hooks/selectors/useUIState';

// MUI
import { Box, Typography, Divider, Chip, Stack, Paper, AppBar, Toolbar, IconButton, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import WarningIcon from '@mui/icons-material/Warning';
import LayersIcon from '@mui/icons-material/Layers';

interface BatchMetrics {
   batches: Array<{
      batchNumber: number;
      recordCount: number;
      metrics: any;
      roundTripTime?: number;
   }>;
   aggregated: {
      totalRecords: number;
      totalBatches: number;
      totalExecutionTime: number;
      avgBatchTime: number;
      totalSoqlExecutionTime: number;
      avgSoqlExecutionTime: number;
      totalRoundTripTime?: number;
      avgRoundTripTime?: number;
      totalNetworkOverhead?: number;
      avgNetworkOverhead?: number;
   };
}

interface QueryMetricsPanelProps {
   queryMetrics: Map<string, number> | Record<string, any> | BatchMetrics | null;
}

// Helper to format camelCase to Title Case
const formatLabel = (key: string): string => {
   return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
};

const formatBytes = (bytes: number) => {
   if (bytes < 1024) return `${bytes} B`;
   const kb = bytes / 1024;

   if (kb < 1024) return `${kb.toFixed(1)} KB`;

   const mb = kb / 1024;

   return `${mb.toFixed(1)} MB`;
};

// Helper component for metric rows
const MetricRow: React.FC<{
   label: string;
   value: string;
   color: 'success' | 'warning' | 'error' | 'default';
}> = ({ label, value, color }) => (
   <Stack
      direction="row" justifyContent="space-between" alignItems="center"
      sx={{ py: 0.5 }}>
      <Typography
         variant="body2"
         color="text.secondary"
         sx={{
            fontSize: '0.8rem'
         }}>
         {label}
      </Typography>
      <Chip
         label={value}
         size="small"
         color={color}
         sx={{ minWidth: '80px' }} />
   </Stack>
);

// Type guard to check if metrics is BatchMetrics
const isBatchMetrics = (metrics: any): metrics is BatchMetrics => {
   return metrics && 'batches' in metrics && 'aggregated' in metrics;
};

const QueryMetricsPanel: React.FC<QueryMetricsPanelProps> = ({ queryMetrics }) => {
   const theme = useTheme();

   // Query state from domain hook
   const { setShowQueryMetricsPanel } = useQueryState();

   if (!queryMetrics) {
      return (
         <Box
            sx={{
               border: 1,
               boxSizing: 'border-box',
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               height: '100%',
               width: 350
            }}>
            <AppBar
               position='sticky'
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  flexShrink: 0
               }}>
               <Toolbar variant="dense">
                  <IconButton
                     size="large"
                     edge="start"
                     color="inherit"
                     aria-label="menu"
                     sx={{ ml: -1 }}
                     onClick={() => setShowQueryMetricsPanel(false)}
                  >
                     <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="button" color="inherit" component="div">
                     Query Metrics
                  </Typography>
               </Toolbar>
            </AppBar>
            <Box sx={{ p: 3, textAlign: 'center' }}>
               <Typography variant="body2" color="text.secondary">
                  No query metrics available. Execute a query to see performance data.
               </Typography>
            </Box>
         </Box>
      );
   }

   // Helper function to get color based on performance
   const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
      if (value < threshold.good) return 'success';
      if (value < threshold.warning) return 'warning';
      return 'error';
   };

   // Format milliseconds
   const formatMs = (value: number) => `${value}ms`;

   // Check if this is the new batch metrics format
   if (isBatchMetrics(queryMetrics)) {
      const { batches, aggregated } = queryMetrics;

      return (
         <Box sx={{
            border: 1,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            height: '100%',
            overflow: 'auto',
            width: 350
         }}>
            {/* Toolbar */}
            <AppBar
               position='sticky'
               sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  flexShrink: 0
               }}>
               <Toolbar variant="dense">
                  <IconButton
                     size="large"
                     edge="start"
                     color="inherit"
                     aria-label="menu"
                     sx={{ ml: -1 }}
                     onClick={() => setShowQueryMetricsPanel(false)}
                  >
                     <ChevronLeftIcon />
                  </IconButton>
                  <Typography variant="button" color="inherit" component="div">
                     Query Metrics
                  </Typography>
               </Toolbar>
            </AppBar>

            {/* Aggregated Summary Stats */}
            <Paper
               elevation={1}
               sx={{
                  p: 2,
                  mb: 2,
                  mt: 2,
                  mx: 2,
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary
               }}>
               <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Overall Summary
               </Typography>
               <Stack spacing={2}>
                  <Box>
                     <Typography variant="caption">
                        Total Execution Time
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon fontSize="small" />
                        <Chip
                           label={formatMs(aggregated.totalExecutionTime)}
                           color={getPerformanceColor(aggregated.totalExecutionTime, { good: 1000, warning: 3000 })}
                           size="small"
                        />
                     </Stack>
                  </Box>

                  <Box>
                     <Typography variant="caption">
                        Total Records
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <StorageIcon fontSize="small" />
                        <Chip
                           label={aggregated.totalRecords.toLocaleString()}
                           color="default"
                           size="small"
                        />
                     </Stack>
                  </Box>

                  <Box>
                     <Typography variant="caption">
                        Number of Batches
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <LayersIcon fontSize="small" />
                        <Chip
                           label={aggregated.totalBatches.toLocaleString()}
                           color={aggregated.totalBatches === 1 ? 'success' : 'default'}
                           size="small"
                        />
                     </Stack>
                  </Box>

                  <Box>
                     <Typography variant="caption">
                        Average Batch Time
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <SpeedIcon fontSize="small" />
                        <Chip
                           label={formatMs(Math.round(aggregated.avgBatchTime))}
                           color={getPerformanceColor(aggregated.avgBatchTime, { good: 800, warning: 2000 })}
                           size="small"
                        />
                     </Stack>
                  </Box>

                  <Box>
                     <Typography variant="caption">
                        Total SOQL Execution Time
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon fontSize="small" />
                        <Chip
                           label={formatMs(aggregated.totalSoqlExecutionTime)}
                           color={getPerformanceColor(aggregated.totalSoqlExecutionTime, { good: 500, warning: 1500 })}
                           size="small"
                        />
                     </Stack>
                  </Box>

                  <Box>
                     <Typography variant="caption">
                        Average SOQL Execution Time
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTimeIcon fontSize="small" />
                        <Chip
                           label={formatMs(Math.round(aggregated.avgSoqlExecutionTime))}
                           color={getPerformanceColor(aggregated.avgSoqlExecutionTime, { good: 300, warning: 1000 })}
                           size="small"
                        />
                     </Stack>
                  </Box>

                  {/* Network Timing Metrics */}
                  {aggregated.avgRoundTripTime !== undefined && (
                     <Box>
                        <Typography variant="caption">
                           Average Round Trip Time
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                           <SpeedIcon fontSize="small" />
                           <Chip
                              label={formatMs(Math.round(aggregated.avgRoundTripTime))}
                              color={getPerformanceColor(aggregated.avgRoundTripTime, { good: 1000, warning: 2500 })}
                              size="small"
                           />
                        </Stack>
                     </Box>
                  )}

                  {aggregated.avgNetworkOverhead !== undefined && (
                     <Box>
                        <Typography variant="caption">
                           Average Network Overhead
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                           <AccessTimeIcon fontSize="small" />
                           <Chip
                              label={formatMs(Math.round(aggregated.avgNetworkOverhead))}
                              color={getPerformanceColor(aggregated.avgNetworkOverhead, { good: 200, warning: 500 })}
                              size="small"
                           />
                        </Stack>
                     </Box>
                  )}
               </Stack>
            </Paper>

            {/* Individual Batch Details */}
            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, mx: 2, fontWeight: 'bold' }}>
               Batch Details
            </Typography>
            {batches.map((batch) => (
               <Accordion
                  key={batch.batchNumber}
                  sx={{
                     mb: 1,
                     mx: 2,
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary
                  }}
                  defaultExpanded={batches.length === 1}
               >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                     <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                           Batch {batch.batchNumber}
                        </Typography>
                        <Chip
                           label={`${batch.recordCount} records`}
                           size="small"
                           color="default"
                        />
                        {batch.metrics.totalExecution !== undefined && (
                           <Chip
                              label={`Apex: ${formatMs(batch.metrics.totalExecution)}`}
                              size="small"
                              color={getPerformanceColor(batch.metrics.totalExecution, { good: 800, warning: 2000 })}
                           />
                        )}
                        {batch.roundTripTime !== undefined && (
                           <Chip
                              label={`RT: ${formatMs(batch.roundTripTime)}`}
                              size="small"
                              color={getPerformanceColor(batch.roundTripTime, { good: 1000, warning: 2500 })}
                           />
                        )}
                     </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                     <BatchMetricsDetails metrics={batch.metrics} />
                  </AccordionDetails>
               </Accordion>
            ))}
         </Box>
      );
   }

   // Legacy format: Convert to plain object if it's a Map
   const metrics = queryMetrics instanceof Map
      ? Object.fromEntries(queryMetrics)
      : queryMetrics;

   // Helper function to get color based on performance
   const getPerformanceColorLegacy = (value: number, threshold: { good: number; warning: number }) => {
      if (value < threshold.good) return 'success';
      if (value < threshold.warning) return 'warning';
      return 'error';
   };

   // Group metrics by category
   const cacheMetrics = {
      fieldMapCacheCheck: metrics.fieldMapCacheCheck,
      fieldMapDeserialization: metrics.fieldMapDeserialization,
      fieldDescribeMapFetch: metrics.fieldDescribeMapFetch,
      childFieldMapCacheCheck: metrics.childFieldMapCacheCheck,
      childFieldMapDeserialization: metrics.childFieldMapDeserialization,
      childFieldMapFetch: metrics.childFieldMapFetch,
   };

   const queryMetricsGroup = {
      whereClauseBuild: metrics.whereClauseBuild,
      combineConditions: metrics.combineConditions,
      countQuery: metrics.countQuery,
      soqlExecution: metrics.soqlExecution,
   };

   const processingMetrics = {
      inputValidation: metrics.inputValidation,
      validateSObject: metrics.validateSObject,
      fieldMapRetrieval: metrics.fieldMapRetrieval,
      fieldSelection: metrics.fieldSelection,
      postProcessRelationships: metrics.postProcessRelationships,
   };

   const totalExecution = metrics.totalExecution || 0;

   const recordCount = metrics.recordCount || 0;

   const countQuerySkipped = metrics.countQuerySkipped === true;

   const heapUsedBytes = metrics.heapUsedBytes ?? metrics.heapUsed;

   const heapLimitBytes = metrics.heapLimitBytes ?? metrics.heapLimit;

   const heapUsedPct = metrics.heapUsedPct ??
      (heapUsedBytes && heapLimitBytes ? (heapUsedBytes / heapLimitBytes) * 100 : null);

   const heapUsageValue = heapUsedBytes !== undefined && heapLimitBytes !== undefined
      ? `${formatBytes(heapUsedBytes)} / ${formatBytes(heapLimitBytes)}${heapUsedPct !== null && heapUsedPct !== undefined ? ` (${Number(heapUsedPct).toFixed(1)}%)` : ''}`
      : heapUsedBytes !== undefined
         ? formatBytes(heapUsedBytes)
         : '';

   return (
      <Box sx={{
         border: 1,
         boxSizing: 'border-box',
         backgroundColor: theme.palette.background.paper,
         color: theme.palette.text.primary,
         height: '100%',
         overflow: 'auto',
         width: 350
      }}>
         {/* Toolbar */}
         <AppBar
            position='sticky'
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               flexShrink: 0
            }}>
            <Toolbar
               variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowQueryMetricsPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography
                  variant="button"
                  color="inherit"
                  component="div">
                  Query Metrics
               </Typography>
            </Toolbar>
         </AppBar>

         {/* Summary Stats */}
         <Paper
            elevation={1}
            sx={{
               p: 2,
               mb: 2,
               mt: 2,
               mx: 2,
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary
            }}>
            <Stack spacing={2}>
               <Box>
                  <Typography variant="caption" >
                     Total Execution Time
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                     <AccessTimeIcon fontSize="small" />
                     <Chip
                        label={formatMs(totalExecution)}
                        color={getPerformanceColorLegacy(totalExecution, { good: 500, warning: 1500 })}
                        size="small"
                     />
                  </Stack>
               </Box>

               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                  }}>
                  <Typography variant="caption" >
                     Records Returned
                  </Typography>
                  <Stack
                     direction="row"
                     alignItems="center"
                     spacing={1}>
                     <StorageIcon fontSize="small" />
                     <Chip
                        label={recordCount.toLocaleString()} color="default" size="small" />
                  </Stack>
               </Box>

               {countQuerySkipped !== undefined && (
                  <Box>
                     <Typography variant="caption" >
                        COUNT Query
                     </Typography>
                     <Stack direction="row" alignItems="center" spacing={1}>
                        {countQuerySkipped ? (
                           <>
                              <CheckCircleIcon fontSize="small" color="success" />
                              <Chip label="Skipped (Optimized)" color="success" size="small" />
                           </>
                        ) : (
                           <>
                              <WarningIcon fontSize="small" color="warning" />
                              <Chip label="Executed" color="warning" size="small" />
                           </>
                        )}
                     </Stack>
                  </Box>
               )}
            </Stack>
         </Paper>

         {(heapUsedBytes !== undefined || heapLimitBytes !== undefined) && (
            <Box
               sx={{
                  mb: 3,
                  mx: 2
               }}>
               <Typography
                  variant="subtitle2"
                  sx={{
                     mb: 1,
                     fontWeight: 'bold'
                  }}>
                  Memory
               </Typography>
               <Stack spacing={1}>
                  <MetricRow
                     label="Heap Usage"
                     value={heapUsageValue}
                     color={typeof heapUsedPct === 'number'
                        ? getPerformanceColorLegacy(heapUsedPct, { good: 50, warning: 75 })
                        : 'default'}
                  />
               </Stack>
            </Box>
         )}

         {/* Cache Metrics */}
         {Object.values(cacheMetrics).some(v => v !== undefined) && (
            <Box
               sx={{
                  mb: 3,
                  mx: 2
               }}>
               <Typography
                  variant="subtitle2"
                  sx={{
                     mb: 1,
                     fontWeight: 'bold'
                  }}>
                  Cache Performance
               </Typography>
               <Stack spacing={1}>
                  {Object.entries(cacheMetrics).map(([key, value]) => {
                     if (value === undefined) return null;
                     return (
                        <MetricRow
                           key={key}
                           label={formatLabel(key)}
                           value={typeof value === 'number' ? formatMs(value) : String(value)}
                           color={typeof value === 'number' ? getPerformanceColorLegacy(value, { good: 50, warning: 150 }) : 'default'}
                        />
                     );
                  })}
               </Stack>
            </Box>
         )}

         {/* Query Building Metrics */}
         {Object.values(queryMetricsGroup).some(v => v !== undefined) && (
            <Box
               sx={{
                  mb: 3,
                  mx: 2
               }}>
               <Typography
                  variant="subtitle2"
                  sx={{
                     mb: 1,
                     fontWeight: 'bold'
                  }}>
                  Query Execution
               </Typography>
               <Stack spacing={1}>
                  {Object.entries(queryMetricsGroup).map(([key, value]) => {
                     if (value === undefined) return null;
                     return (
                        <MetricRow
                           key={key}
                           label={formatLabel(key)}
                           value={typeof value === 'number' ? formatMs(value) : String(value)}
                           color={typeof value === 'number' ? getPerformanceColorLegacy(value, { good: 100, warning: 500 }) : 'default'}
                        />
                     );
                  })}
               </Stack>
            </Box>
         )}

         {/* Processing Metrics */}
         {Object.values(processingMetrics).some(v => v !== undefined) && (
            <Box
               sx={{
                  mb: 3,
                  mx: 2
               }}>
               <Typography
                  variant="subtitle2"
                  sx={{
                     mb: 1,
                     fontWeight: 'bold'
                  }}>
                  Data Processing
               </Typography>
               <Stack spacing={1}>
                  {Object.entries(processingMetrics).map(([key, value]) => {
                     if (value === undefined) return null;
                     return (
                        <MetricRow
                           key={key}
                           label={formatLabel(key)}
                           value={typeof value === 'number' ? formatMs(value) : String(value)}
                           color={typeof value === 'number' ? getPerformanceColorLegacy(value, { good: 50, warning: 200 }) : 'default'}
                        />
                     );
                  })}
               </Stack>
            </Box>
         )}

         {/* All Other Metrics */}
         <Box
            sx={{
               mx: 2,
               mb: 2
            }}>
            <Typography
               variant="subtitle2"
               sx={{
                  mb: 1,
                  fontWeight: 'bold'
               }}>
               Other Metrics
            </Typography>
            <Stack spacing={1}>
               {Object.entries(metrics).map(([key, value]) => {
                  // Skip metrics we've already shown
                  if (
                     key in cacheMetrics ||
                     key in queryMetricsGroup ||
                     key in processingMetrics ||
                     key === 'totalExecution' ||
                     key === 'recordCount' ||
                     key === 'countQuerySkipped' ||
                     key === 'heapUsedBytes' ||
                     key === 'heapLimitBytes' ||
                     key === 'heapUsedPct' ||
                     key === 'heapUsed' ||
                     key === 'heapLimit'
                  ) {
                     return null;
                  }
                  return (
                     <MetricRow
                        key={key}
                        label={formatLabel(key)}
                        value={typeof value === 'number' ? formatMs(value) : String(value)}
                        color="default"
                     />
                  );
               })}
            </Stack>
         </Box>
      </Box>
   );
};

// Separate component for batch metrics details
const BatchMetricsDetails: React.FC<{ metrics: any }> = ({ metrics }) => {
   const getPerformanceColor = (value: number, threshold: { good: number; warning: number }) => {
      if (value < threshold.good) return 'success';
      if (value < threshold.warning) return 'warning';
      return 'error';
   };

   const formatMs = (value: number) => `${value}ms`;

   // Group metrics by category
   const cacheMetrics: Record<string, any> = {};
   const queryMetricsGroup: Record<string, any> = {};
   const processingMetrics: Record<string, any> = {};
   const memoryMetrics: Record<string, any> = {};
   const otherMetrics: Record<string, any> = {};

   // Categorize all metrics
   Object.entries(metrics).forEach(([key, value]) => {
      if (['fieldMapCacheCheck', 'fieldMapDeserialization', 'fieldDescribeMapFetch',
         'childFieldMapCacheCheck', 'childFieldMapDeserialization', 'childFieldMapFetch'].includes(key)) {
         cacheMetrics[key] = value;
      } else if (['whereClauseBuilding', 'whereClauseBuild', 'combineConditions', 'countQuery', 'soqlExecution'].includes(key)) {
         queryMetricsGroup[key] = value;
      } else if (['inputValidation', 'validateSObject', 'fieldMapRetrieval', 'fieldSelection',
         'jsonDeserialization', 'postProcessRelationships'].includes(key)) {
         processingMetrics[key] = value;
      } else if (['heapUsedBytes', 'heapLimitBytes', 'heapUsedPct', 'heapUsed', 'heapLimit'].includes(key)) {
         memoryMetrics[key] = value;
      } else if (!['totalExecution', 'total', 'recordCount', 'countQuerySkipped'].includes(key)) {
         otherMetrics[key] = value;
      }
   });

   const countQuerySkipped = metrics.countQuerySkipped === true;

   return (
      <Stack spacing={2}>
         {/* Key Metrics */}
         {metrics.totalExecution !== undefined && (
            <MetricRow
               label="Total Execution"
               value={formatMs(metrics.totalExecution)}
               color={getPerformanceColor(metrics.totalExecution, { good: 800, warning: 2000 })}
            />
         )}
         {metrics.soqlExecution !== undefined && (
            <MetricRow
               label="SOQL Execution"
               value={formatMs(metrics.soqlExecution)}
               color={getPerformanceColor(metrics.soqlExecution, { good: 300, warning: 1000 })}
            />
         )}

         {countQuerySkipped !== undefined && (
            <Box>
               <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  COUNT Query
               </Typography>
               <Stack direction="row" alignItems="center" spacing={1}>
                  {countQuerySkipped ? (
                     <>
                        <CheckCircleIcon fontSize="small" color="success" />
                        <Chip label="Skipped" color="success" size="small" />
                     </>
                  ) : (
                     <>
                        <WarningIcon fontSize="small" color="warning" />
                        <Chip label="Executed" color="warning" size="small" />
                     </>
                  )}
               </Stack>
            </Box>
         )}

         <Divider sx={{ my: 1 }} />

         {/* Processing Metrics */}
         {Object.keys(processingMetrics).length > 0 && (
            <Box>
               <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Processing
               </Typography>
               <Stack spacing={0.5}>
                  {Object.entries(processingMetrics).map(([key, value]) => (
                     <MetricRow
                        key={key}
                        label={formatLabel(key)}
                        value={typeof value === 'number' ? formatMs(value) : String(value)}
                        color={typeof value === 'number' ? getPerformanceColor(value, { good: 50, warning: 200 }) : 'default'}
                     />
                  ))}
               </Stack>
            </Box>
         )}

         {/* Memory Metrics */}
         {Object.keys(memoryMetrics).length > 0 && (
            <Box>
               <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Memory
               </Typography>
               <Stack spacing={0.5}>
                  {(() => {
                     const heapUsedBytes = memoryMetrics.heapUsedBytes ?? memoryMetrics.heapUsed;
                     const heapLimitBytes = memoryMetrics.heapLimitBytes ?? memoryMetrics.heapLimit;
                     const heapUsedPct = memoryMetrics.heapUsedPct ??
                        (heapUsedBytes && heapLimitBytes ? (heapUsedBytes / heapLimitBytes) * 100 : null);

                     const heapUsageValue = heapUsedBytes !== undefined && heapLimitBytes !== undefined
                        ? `${formatBytes(heapUsedBytes)} / ${formatBytes(heapLimitBytes)}${heapUsedPct !== null && heapUsedPct !== undefined ? ` (${Number(heapUsedPct).toFixed(1)}%)` : ''}`
                        : heapUsedBytes !== undefined
                           ? formatBytes(heapUsedBytes)
                           : '';

                     if (!heapUsageValue) return null;

                     return (
                        <MetricRow
                           label="Heap Usage"
                           value={heapUsageValue}
                           color={typeof heapUsedPct === 'number'
                              ? getPerformanceColor(heapUsedPct, { good: 50, warning: 75 })
                              : 'default'}
                        />
                     );
                  })()}
               </Stack>
            </Box>
         )}

         {/* Cache Metrics */}
         {Object.keys(cacheMetrics).length > 0 && (
            <Box>
               <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Cache Performance
               </Typography>
               <Stack spacing={0.5}>
                  {Object.entries(cacheMetrics).map(([key, value]) => (
                     <MetricRow
                        key={key}
                        label={formatLabel(key)}
                        value={typeof value === 'number' ? formatMs(value) : String(value)}
                        color={typeof value === 'number' ? getPerformanceColor(value, { good: 50, warning: 150 }) : 'default'}
                     />
                  ))}
               </Stack>
            </Box>
         )}

         {/* Query Building Metrics */}
         {Object.keys(queryMetricsGroup).length > 0 && (
            <Box>
               <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Query Building
               </Typography>
               <Stack spacing={0.5}>
                  {Object.entries(queryMetricsGroup).map(([key, value]) => (
                     <MetricRow
                        key={key}
                        label={formatLabel(key)}
                        value={typeof value === 'number' ? formatMs(value) : String(value)}
                        color={typeof value === 'number' ? getPerformanceColor(value, { good: 100, warning: 500 }) : 'default'}
                     />
                  ))}
               </Stack>
            </Box>
         )}

         {/* Other Metrics */}
         {Object.keys(otherMetrics).length > 0 && (
            <Box>
               <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                  Other
               </Typography>
               <Stack spacing={0.5}>
                  {Object.entries(otherMetrics).map(([key, value]) => (
                     <MetricRow
                        key={key}
                        label={formatLabel(key)}
                        value={typeof value === 'number' ? formatMs(value) : String(value)}
                        color="default"
                     />
                  ))}
               </Stack>
            </Box>
         )}
      </Stack>
   );
};

export default QueryMetricsPanel;
