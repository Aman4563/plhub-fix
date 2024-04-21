import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoadingButton } from '@mui/lab';
import { Alert, TextField } from '@mui/material';
import { useFormik } from 'formik';
import styled, { keyframes } from 'styled-components';
import feedbackApi from '../../api/modules/feedback.api';
import { themeModes } from '../../configs/theme.configs'; // Import themeModes from theme config

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const successAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
`;

// Styled components
const FormContainer = styled.form`
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${({ theme }) => theme}; // Use theme color for background
  color: ${({ theme }) => (theme === themeModes.dark ? '#fff' : '#000')}; // Use theme color for text
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.5s ease;
  transition: background-color 0.3s; // Add transition for smooth color change
`;

const CustomTextField = styled(TextField)`
  margin-bottom: 10px !important;
  input {
    color: ${({ theme }) => (theme)}; // Use theme color for text
  }
`;

const SubmitButton = styled(LoadingButton)`
  width: 100%;
  margin-top: 20px !important;
  color: ${({ theme }) => (theme === themeModes.dark ? '#000' : '#fff')}; // Invert button color
  animation: ${({ success }) => (success ? successAnimation : 'none')} 0.5s ease; // Apply success animation if success is true
`;

const ErrorAlert = styled(Alert)`
  margin-top: 20px;
`;

const FeedbackForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false); // State to manage success animation

  const formik = useFormik({
    initialValues: {
      user: '',
      feedback: ''
    },
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const { response, err } = await feedbackApi.submitFeedback(values);
        setIsSubmitting(false);
        if (response) {
          formik.resetForm();
          toast.success('Feedback submitted successfully!', { position: 'bottom-left' }); // Set position to bottom-left
          setSuccess(true); // Trigger success animation
          setTimeout(() => setSuccess(false), 500); // Reset success animation after 500ms
        }
        if (err) {
          setErrorMessage('Error submitting feedback. Please try again.');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        setErrorMessage('Error submitting feedback. Please try again.');
        setIsSubmitting(false);
      }
    }
  });

  return (
    <FormContainer onSubmit={formik.handleSubmit} theme={themeModes.light}>
      <CustomTextField
        fullWidth
        id="user"
        name="user"
        label="Username"
        variant="outlined"
        value={formik.values.user}
        onChange={formik.handleChange}
        error={formik.touched.user && Boolean(formik.errors.user)}
        helperText={formik.touched.user && formik.errors.user}
        theme={themeModes.light}
      />
      <CustomTextField
        fullWidth
        id="feedback"
        name="feedback"
        label="Feedback"
        multiline
        rows={4}
        variant="outlined"
        value={formik.values.feedback}
        onChange={formik.handleChange}
        error={formik.touched.feedback && Boolean(formik.errors.feedback)}
        helperText={formik.touched.feedback && formik.errors.feedback}
        theme={themeModes.light}
      />

      <SubmitButton
        type="submit"
        variant="contained"
        loading={isSubmitting}
        success={success.toString()} // Pass success state to the styled component as string
        size="large"
        sx={{ marginTop: 4 }}
      >
        Submit Feedback
      </SubmitButton>

      {errorMessage && (
        <ErrorAlert severity="error" variant="outlined">
          {errorMessage}
        </ErrorAlert>
      )}

      <ToastContainer autoClose={3000} />
    </FormContainer>
  );
};

export default FeedbackForm;
