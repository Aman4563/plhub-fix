// import React, { useState, useEffect } from 'react';
// import SpreadsheetDisplay from './SpreadsheetDisplay';
// import FeedbackForm from './FeedbackForm';
// import * as XLSX from 'xlsx';

// const FeedbackSpreadsheet = () => {
//     const [feedbackData, setFeedbackData] = useState([]);

//     useEffect(() => {
//         // Read data from the Excel file when the component mounts
//         fetchDataFromExcel();
//     }, []);

//     const fetchDataFromExcel = () => {
//         const url = '/feedback.xlsx';
//         fetch(url)
//             .then((res) => res.arrayBuffer())
//             .then((arrayBuffer) => {
//                 const data = new Uint8Array(arrayBuffer);
//                 const workbook = XLSX.read(data, { type: 'array' });
//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];
//                 const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//                 setFeedbackData(jsonData);
//             })
//             .catch((error) => {
//                 console.error('Error reading Excel file:', error);
//             });
//     };

//     const handleFeedbackSubmit = (feedback) => {
//         const newData = [...feedbackData, [feedback]];
//         updateExcelFile(newData);
//     };

//     const updateExcelFile = (data) => {
//         const worksheet = XLSX.utils.aoa_to_sheet(data);
//         const newWorkbook = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Sheet1');
//         const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
//         const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//         // Update feedback.xlsx file in public folder
//         fetch('/feedback.xlsx', {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//             },
//             body: blob
//         }).then(() => {
//             console.log('Feedback file updated successfully');
//             // Update local state after updating the file
//             setFeedbackData(data);
//         }).catch(error => console.error('Error updating feedback file:', error));
//     };

//     return (
//         <div>
//             <SpreadsheetDisplay data={feedbackData} />
//             <FeedbackForm onSubmit={handleFeedbackSubmit} />
//         </div>
//     );
// };

// export default FeedbackSpreadsheet;

import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, Paper, Divider, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import FeedbackForm from '../components/common/FeedbackForm';
import FeedbackList from '../components/common/FeedbackList';
import { Feedback as FeedbackIcon } from '@mui/icons-material';

const FeedbackSpreadsheet = () => {
    const theme = useTheme();
    const [refreshKey, setRefreshKey] = useState(0);

    // Callback to refresh the feedback list after submission
    const handleFeedbackSubmitted = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                py: { xs: 4, md: 6 },
                background: theme.palette.mode === "dark"
                    ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.3)} 0%, ${theme.palette.background.default} 100%)`
                    : theme.palette.background.default,
            }}
        >
            <Container maxWidth="md">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header Section */}
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Box
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                mb: 2,
                            }}
                        >
                            <FeedbackIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                        </Box>
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            Feedback & Requests
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: "auto" }}>
                            Share your thoughts, suggestions, or request movies and TV shows you'd like to see on PLHub.
                        </Typography>
                    </Box>

                    {/* Feedback Form Section */}
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            mb: 4,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Submit Your Feedback
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Your feedback helps us improve PLHub. Let us know what you think!
                        </Typography>
                        <FeedbackForm onSuccess={handleFeedbackSubmitted} />
                    </Paper>

                    <Divider sx={{ my: 4 }} />

                    {/* Feedback List Section */}
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                            Community Feedback
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            See what others are saying about PLHub.
                        </Typography>
                        <FeedbackList key={refreshKey} />
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default FeedbackSpreadsheet;



// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { saveAs } from 'file-saver';
// import * as XLSX from 'xlsx';

// const FeedbackSpreadsheet = () => {
//   const [feedbackData, setFeedbackData] = useState([]);

//   useEffect(() => {
//     fetchFeedbackData();
//   }, []);

//   const fetchFeedbackData = async () => {
//     try {
//       const response = await axios.get('http://localhost:8000/api/v1/feedback/feedback-list');
//       setFeedbackData(response.data);
//     } catch (error) {
//       console.error('Error fetching feedback data:', error);
//     }
//   };

//   const handleDownload = () => {
//     const csvData = feedbackData.map(feedback => {
//       return `${feedback.user},${feedback.feedback},${feedback.createdAt}`;
//     }).join('\n');
//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.json_to_sheet(feedbackData);
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback Data');
//     const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
//     const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//     saveAs(blob, 'feedback_data.xlsx');
//   };

//   return (
//     <div>
//       <h2>Feedback Spreadsheet</h2>
//       <table>
//         <thead>
//           <tr>
//             <th>User</th>
//             <th>Feedback</th>
//             <th>Timestamp</th>
//           </tr>
//         </thead>
//         <tbody>
//           {feedbackData.map(feedback => (
//             <tr key={feedback._id}>
//               <td>{feedback.user}</td>
//               <td>{feedback.feedback}</td>
//               <td>{new Date(feedback.createdAt).toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <button onClick={handleDownload}>Download Feedback Data</button>
//     </div>
//   );
// };

// export default FeedbackSpreadsheet;