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

const SCUsecaseListDialog = ({ open, onClose, title, data, showExport = true }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter data based on search query
    const filteredData = React.useMemo(() => {
        if (!data) return [];
        if (!searchQuery) return data;

        const lowerQuery = searchQuery.toLowerCase();
        return data.filter(row => {
            return Object.values(row).some(val =>
                val !== null &&
                val !== undefined &&
                String(val).toLowerCase().includes(lowerQuery)
            );
        });
    }, [data, searchQuery]);

    const handleDownloadExcel = () => {
        if (!filteredData || filteredData.length === 0) return;

        const excelData = filteredData.map((report, index) => ({
            'Sr. No.': index + 1,
            'Project Name': report.poc_prj_name || '',
            'Client Name': report.client_name || '',
            'Partner Name': report.partner_name || '',
            'Client Type': report.partner_client_own || '',
            'Status': report.status || '',
            'Start Date': report.start_date || '',
            'Expected End Date': report.excepted_end_date || '',
            'Actual Start Date': report.actual_start_date || '',
            'Actual End Date': report.actual_end_date || '',
            'Sales Person': report.sales_person || '',
            'Assigned To': report.assigned_to || '',
            'Usecase Type': report.poc_type || '',
            'Industry': report.industry_type || '',
            'Meeting Mode': report.meeting_mode || '',
            'Call Type': report.call_type || '',
            'Region': report.region || '',
            'Description': report.description || '',
            'Remarks': report.remarks || '',
            'Estimated Efforts': report.estimated_efforts || '',
            'Total Efforts': report.total_efforts || '',
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        const borderStyle = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        };

        // Columns that should be capped at a readable width (manually resizable in Excel)
        const CAPPED_COLS = ['Description', 'Remarks'];
        const MAX_COL_WIDTH = 40;   // max width for capped columns (chars)
        const DEFAULT_MAX_WIDTH = 30; // max width for all other columns

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellRef]) continue;

                ws[cellRef].s = {
                    border: borderStyle,
                    font: { name: 'Calibri', sz: 11 },
                    // Removed wrapText so Excel doesn't lock row height and columns stay freely resizable
                    alignment: { vertical: 'center', horizontal: 'left' }
                };

                if (R === 0) {
                    ws[cellRef].s.fill = {
                        patternType: 'solid',
                        fgColor: { rgb: "FFFF00" }
                    };
                    ws[cellRef].s.font = { name: 'Calibri', sz: 11, bold: true };
                    ws[cellRef].s.alignment = { vertical: 'center', horizontal: 'center' };
                }
            }
        }

        const colKeys = Object.keys(excelData[0] || {});
        const colWidths = colKeys.map(key => {
            const isCapped = CAPPED_COLS.includes(key);
            const maxAllowed = isCapped ? MAX_COL_WIDTH : DEFAULT_MAX_WIDTH;
            const maxContentLength = Math.max(...excelData.map(row => String(row[key] || '').length));
            // Cap width so columns aren't stretched wide — user can drag to expand in Excel
            const width = Math.min(Math.max(maxContentLength, key.length) + 2, maxAllowed);
            return { wch: width };
        });
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, "SC_Reports");

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('completed') || s.includes('done') || s.includes('success')) return 'success';
        if (s.includes('converted')) return 'secondary';
        if (s.includes('progress') || s.includes('ongoing')) return 'warning';
        if (s.includes('pending') || s.includes('waiting') || s.includes('awaiting')) return 'info';
        if (s.includes('hold')) return 'error';
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
            <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
                {filteredData && filteredData.length > 0 ? (
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: '#f5f5f5', whiteSpace: 'nowrap' } }}>
                                    <TableCell>Sr. No.</TableCell>
                                    <TableCell>Project Name</TableCell>
                                    <TableCell>Client Name</TableCell>
                                    <TableCell>Partner Name</TableCell>
                                    <TableCell>Client Type</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>Expected End Date</TableCell>
                                    <TableCell>Actual Start Date</TableCell>
                                    <TableCell>Actual End Date</TableCell>
                                    <TableCell>Sales Person</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Usecase Type</TableCell>
                                    <TableCell>Industry</TableCell>
                                    <TableCell>Meeting Mode</TableCell>
                                    <TableCell>Call Type</TableCell>
                                    <TableCell>Region</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Remarks</TableCell>
                                    <TableCell>Estimated Efforts</TableCell>
                                    <TableCell>Total Efforts</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.map((row, index) => (
                                    <TableRow key={index} hover sx={{ '& td': { whiteSpace: 'nowrap' } }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 'medium' }}>{row.poc_prj_name || 'N/A'}</TableCell>
                                        <TableCell>{row.client_name || 'N/A'}</TableCell>
                                        <TableCell>{row.partner_name || 'N/A'}</TableCell>
                                        <TableCell>{row.partner_client_own || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status || 'N/A'}
                                                size="small"
                                                color={getStatusColor(row.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{row.start_date || 'N/A'}</TableCell>
                                        <TableCell>{row.excepted_end_date || 'N/A'}</TableCell>
                                        <TableCell>{row.actual_start_date || 'N/A'}</TableCell>
                                        <TableCell>{row.actual_end_date || 'N/A'}</TableCell>
                                        <TableCell>{row.sales_person || 'N/A'}</TableCell>
                                        <TableCell>{row.assigned_to || 'N/A'}</TableCell>
                                        <TableCell>{row.poc_type || 'N/A'}</TableCell>
                                        <TableCell>{row.industry_type || 'N/A'}</TableCell>
                                        <TableCell>{row.meeting_mode || 'N/A'}</TableCell>
                                        <TableCell>{row.call_type || 'N/A'}</TableCell>
                                        <TableCell>{row.region || 'N/A'}</TableCell>
                                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {row.description || 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {row.remarks || 'N/A'}
                                        </TableCell>
                                        <TableCell>{row.estimated_efforts || 'N/A'}</TableCell>
                                        <TableCell>{row.total_efforts || 'N/A'}</TableCell>
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

export default SCUsecaseListDialog;
