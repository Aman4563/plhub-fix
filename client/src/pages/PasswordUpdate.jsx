import { LoadingButton } from "@mui/lab";
import { Box, Stack, TextField } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import Container from "../components/common/Container";
import uiConfigs from "../configs/ui.configs";
import { useState } from "react";
import userApi from "../api/modules/user.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/features/userSlice";
import { setAuthModalOpen } from "../redux/features/authModalSlice";

/**
 * PasswordUpdate Component
 * - Allows users to update their password.
 * - Validates inputs using Formik and Yup.
 * - On success, logs the user out and redirects to the homepage.
 */
const PasswordUpdate = () => {
  const [onRequest, setOnRequest] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Formik form handling and validation
  const form = useFormik({
    initialValues: {
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
      newPassword: Yup.string()
        .min(8, "New password must be at least 8 characters")
        .required("New password is required"),
      confirmNewPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .min(8, "Confirm password must be at least 8 characters")
        .required("Confirm password is required"),
    }),
    onSubmit: async (values) => onUpdate(values),
  });

  /**
   * Handles password update logic.
   *
   * @param {Object} values - Form values containing old password, new password, and confirm password.
   */
  const onUpdate = async (values) => {
    if (onRequest) return;

    setOnRequest(true);
    const { response, err } = await userApi.passwordUpdate(values);
    setOnRequest(false);

    if (err) {
      toast.error(err.message);
      return;
    }

    if (response) {
      form.resetForm();
      navigate("/");
      dispatch(setUser(null));
      dispatch(setAuthModalOpen(true));
      toast.success("Password updated successfully! Please re-login.");
    }
  };

  return (
    <Box sx={{ ...uiConfigs.style.mainContent }}>
      <Container header="Update Password">
        <Box component="form" maxWidth="400px" onSubmit={form.handleSubmit}>
          <Stack spacing={2}>
            {/* Current Password */}
            <TextField
              type="password"
              placeholder="Current password"
              name="password"
              fullWidth
              value={form.values.password}
              onChange={form.handleChange}
              color="success"
              error={form.touched.password && Boolean(form.errors.password)}
              helperText={form.touched.password && form.errors.password}
            />

            {/* New Password */}
            <TextField
              type="password"
              placeholder="New password"
              name="newPassword"
              fullWidth
              value={form.values.newPassword}
              onChange={form.handleChange}
              color="success"
              error={form.touched.newPassword && Boolean(form.errors.newPassword)}
              helperText={form.touched.newPassword && form.errors.newPassword}
            />

            {/* Confirm New Password */}
            <TextField
              type="password"
              placeholder="Confirm new password"
              name="confirmNewPassword"
              fullWidth
              value={form.values.confirmNewPassword}
              onChange={form.handleChange}
              color="success"
              error={
                form.touched.confirmNewPassword && Boolean(form.errors.confirmNewPassword)
              }
              helperText={
                form.touched.confirmNewPassword && form.errors.confirmNewPassword
              }
            />

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              variant="contained"
              fullWidth
              sx={{ marginTop: 4 }}
              loading={onRequest}
            >
              Update Password
            </LoadingButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default PasswordUpdate;
