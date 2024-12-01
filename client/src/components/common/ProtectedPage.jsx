import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthModalOpen } from "../../redux/features/authModalSlice";

/**
 * ProtectedPage Component
 * - Wraps content that should only be accessible to authenticated users.
 * - Opens the authentication modal if the user is not logged in.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - The child components to render if the user is authenticated.
 */
const ProtectedPage = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    // Open the authentication modal if the user is not authenticated
    if (!user) {
      dispatch(setAuthModalOpen(true));
    }
  }, [user, dispatch]);

  // Render children if user is authenticated, otherwise return null
  return user ? children : null;
};

export default ProtectedPage;
