import auth from './reducers/auth';
import authStatus from './reducers/authStatus';
import AuthClient from './AuthClient';

export default AuthClient;
export { AuthClient as AuthClient };
export { auth as authReducer };
export { authStatus as authStatusReducer };
