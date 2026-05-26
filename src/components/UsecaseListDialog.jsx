import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    IconButton,
    Chip,
    TextField,
    InputAdornment
} from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx-js-style';

const UsecaseListDialog = ({ open, onClose, title, data, showExport = true, isSalesReport = false }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter data based on search query
    const filteredData = React.useMemo(() => {
        if (!data) return [];
        if (!searchQuery) return data;

        const lowerQuery = searchQuery.toLowerCase();
        return data.filter(row => {
            // Check if any value in the row object contains the search query
            return Object.values(row).some(val =>
                val !== null &&
                val !== undefined &&
                String(val).toLowerCase().includes(lowerQuery)
            );
        });
    }, [data, searchQuery]);

    const handleDownloadExcel = () => {
        if (!filteredData || filteredData.length === 0) return;

        // Create a formatted array for Excel
        const excelData = filteredData.map((report, index) => ({
            'Sr. No.': index + 1,
            'Usecase ID': report.id || '',
            'Usecase Name': report.pocName || report.poc_prj_name || '',
            'Client Name': report.entityName || report.companyName || '',
            'Partner Name': report.partnerName || '',
            'Description': report.description || report.usecase || '',
            'Tags': report.tags || '',
            'Usecase Type': report.pocType || report.poc_type || '',
            'Customer Type': report.partner_client_own || '',
            'Is Billable': report.isBillable || '',
            'Status': report.status || '',
            'Start Date': report.startDate || report.start_date || '',
            'End Date': report.endDate || report.excepted_end_date || '',
            'Actual Start Date': report.actualStartDate || '',
            'Actual End Date': report.actualEndDate || '',
            'Sales Person': report.salesPerson || report.sales_person || '',
            'Assigned To': report.assignedTo || report.assigned_to || '',
            'Created By': report.createdBy || '',
            'Region': report.region || '',
            'SPOC Email': report.spocEmail || '',
            'SPOC Designation': report.spocDesignation || '',
            'Estimated Efforts (Days)': report.estimatedEfforts || '',
            'Total Efforts (Days)': report.totalEfforts || '',
            'Variance Days': report.varianceDays || '',
            'Approved By': report.approvedBy || '',
            'Remark': report.remark || '',
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Define border style
        const borderStyle = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        };

        // Apply styles to all cells
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) continue;

                ws[cellRef].s = {
                    border: borderStyle,
                    font: {
                        name: 'Calibri',
                        sz: 11
                    },
                    alignment: {
                        vertical: 'center',
                        wrapText: true
                    }
                };

                // Add header specific styles (yellow background, bold)
                if (R === 0) {
                    ws[cellRef].s.fill = {
                        patternType: 'solid',
                        fgColor: { rgb: "FFFF00" } // Yellow
                    };
                    ws[cellRef].s.font.bold = true;
                }
            }
        }

        // Auto-size columns based on header length and content
        const colWidths = Object.keys(excelData[0] || {}).map(key => {
            const maxContentLength = Math.max(...excelData.map(row => String(row[key] || '').length));
            return { wch: Math.max(maxContentLength, key.length) + 2 };
        });
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Usecases");

        // Format Date
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        // Format title for filename
        const safeTitle = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'Usecases_Report';

        // Generate filename based on request
        const fileName = `${safeTitle}_${dateStr}_${filteredData.length}_records.xlsx`;

        // Save file
        XLSX.writeFile(wb, fileName);
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('completed') || s.includes('done') || s.includes('success')) return 'success';
        if (s.includes('converted')) return 'secondary';
        if (s.includes('progress') || s.includes('ongoing')) return 'warning';
        if (s.includes('pending') || s.includes('waiting')) return 'info';
        if (s.includes('cancel') || s.includes('reject') || s.includes('failed') || s.includes('dropped')) return 'error';
        return 'default';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                    {title} ({filteredData?.length || 0})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        sx={{
                            bgcolor: 'white',
                            borderRadius: 1,
                            input: { color: 'black' },
                            width: 250
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {showExport && (
                        <Button
                            onClick={handleDownloadExcel}
                            color="inherit"
                            startIcon={<DownloadIcon />}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                            disabled={!filteredData || filteredData.length === 0}
                        >
                            Export Excel
                        </Button>
                    )}
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 0.5, overflow: 'hidden' }}>
                {filteredData && filteredData.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{
                        border: '1px solid #e0e0e0',
                        maxHeight: 'calc(100vh - 220px)',
                        overflow: 'auto'
                    }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: '#f5f5f5', whiteSpace: 'nowrap' } }}>
                                    <TableCell sx={{
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 3,
                                        bgcolor: '#f5f5f5',
                                        boxShadow: '2px 0 2px -1px rgba(0,0,0,0.1)'
                                    }}>Sr. No.</TableCell>
                                    {!isSalesReport && <TableCell>Usecase ID</TableCell>}
                                    <TableCell>Usecase Name</TableCell>
                                    <TableCell>Client Name</TableCell>
                                    <TableCell>Partner Name</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Tags</TableCell>
                                    <TableCell>Usecase Type</TableCell>
                                    <TableCell>Customer Type</TableCell>
                                    <TableCell>Is Billable</TableCell>
                                    {!isSalesReport && <TableCell>Status</TableCell>}
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Actual Start Date</TableCell>
                                    <TableCell>Actual End Date</TableCell>
                                    <TableCell>Sales Person</TableCell>
                                    {!isSalesReport && <TableCell>Assigned To</TableCell>}
                                    {!isSalesReport && <TableCell>Created By</TableCell>}
                                    <TableCell>Region</TableCell>
                                    <TableCell>SPOC Email</TableCell>
                                    <TableCell>SPOC Designation</TableCell>
                                    <TableCell>Estimated Efforts (Days)</TableCell>
                                    <TableCell>Total Efforts (Days)</TableCell>
                                    {!isSalesReport && <TableCell>Variance Days</TableCell>}
                                    {!isSalesReport && <TableCell>Approved By</TableCell>}
                                    {!isSalesReport && <TableCell>Status</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.map((row, index) => (
                                    <TableRow key={index} hover sx={{
                                        '& td': { whiteSpace: 'nowrap' },
                                        '&:hover td:first-of-type': { bgcolor: '#f5f5f5 !important' }
                                    }}>
                                        <TableCell sx={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 1,
                                            bgcolor: 'white',
                                            boxShadow: '2px 0 2px -1px rgba(0,0,0,0.1)'
                                        }}>{index + 1}</TableCell>
                                        {!isSalesReport && <TableCell>{row.id || 'N/A'}</TableCell>}
                                        <TableCell sx={{ fontWeight: 'medium' }}>{row.pocName || row.poc_prj_name || 'N/A'}</TableCell>
                                        <TableCell>{row.entityName || row.companyName || 'N/A'}</TableCell>
                                        <TableCell>{row.partnerName || 'N/A'}</TableCell>
                                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.description || row.usecase || 'N/A'}</TableCell>
                                        <TableCell>{row.tags || 'N/A'}</TableCell>
                                        <TableCell>{row.pocType || row.poc_type || 'N/A'}</TableCell>
                                        <TableCell>{row.partner_client_own || 'N/A'}</TableCell>
                                        <TableCell>{row.isBillable || 'N/A'}</TableCell>
                                        {!isSalesReport && (
                                            <TableCell>
                                                <Chip
                                                    label={row.status || 'N/A'}
                                                    size="small"
                                                    color={getStatusColor(row.status)}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{row.startDate || row.start_date || 'N/A'}</TableCell>
                                        <TableCell>{row.endDate || row.excepted_end_date || 'N/A'}</TableCell>
                                        <TableCell>{row.actualStartDate || 'N/A'}</TableCell>
                                        <TableCell>{row.actualEndDate || 'N/A'}</TableCell>
                                        <TableCell>{row.salesPerson || row.sales_person || 'N/A'}</TableCell>
                                        {!isSalesReport && <TableCell>{row.assignedTo || row.assigned_to || 'N/A'}</TableCell>}
                                        {!isSalesReport && <TableCell>{row.createdBy || 'N/A'}</TableCell>}
                                        <TableCell>{row.region || 'N/A'}</TableCell>
                                        <TableCell>{row.spocEmail || 'N/A'}</TableCell>
                                        <TableCell>{row.spocDesignation || 'N/A'}</TableCell>
                                        <TableCell>{row.estimatedEfforts || 'N/A'}</TableCell>
                                        <TableCell>{row.totalEfforts || 'N/A'}</TableCell>
                                        {!isSalesReport && <TableCell>{row.varianceDays || 'N/A'}</TableCell>}
                                        {!isSalesReport && <TableCell>{row.approvedBy || 'N/A'}</TableCell>}
                                        {!isSalesReport && <TableCell>{row.remark || 'N/A'}</TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No data available</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default UsecaseListDialog;
