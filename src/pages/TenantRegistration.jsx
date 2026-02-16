import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const TenantRegistration = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        fullName: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await register(
                formData.businessName,
                formData.fullName,
                formData.email,
                formData.password
            );
            setError('');
            navigate(`/dashboard/${data.tenant.subdomain}`);
        } catch (err) {

            const errorData = err.response?.data;

            if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
                const errorMessages = errorData.details.map(e => e.message).join(', ');
                setError(errorMessages);
            } else if (errorData?.error) {
                setError(errorData.error);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-xxl">
            <div className="authentication-wrapper authentication-basic container-p-y">
                <div className="authentication-inner">
                    <div className="card">
                        <div className="card-body">
                            {/* Logo */}
                            <div className="app-brand justify-content-center">
                                <a href="/" className="app-brand-link gap-2">
                                    <span className="app-brand-text demo text-body fw-bolder">ERP System</span>
                                </a>
                            </div>

                            <h4 className="mb-2">Adventure starts here 🚀</h4>
                            <p className="mb-4">Make your business management easy and efficient!</p>

                            {error && (
                                <div className="alert alert-danger alert-dismissible" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mb-3">
                                <div className="mb-3">
                                    <label htmlFor="businessName" className="form-label">Business Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="businessName"
                                        name="businessName"
                                        placeholder="Enter your business name"
                                        value={formData.businessName}
                                        onChange={handleChange}
                                        autoFocus
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="fullName" className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="fullName"
                                        name="fullName"
                                        placeholder="Enter your full name"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3 form-password-toggle">
                                    <label className="form-label" htmlFor="password">Password</label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type="password"
                                            id="password"
                                            className="form-control"
                                            name="password"
                                            placeholder="············"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <small className="text-muted">
                                        Must be 8+ characters with uppercase, lowercase, number, and special character
                                    </small>
                                </div>

                                <button
                                    className="btn btn-primary d-grid w-100"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating account...' : 'Sign up'}
                                </button>
                            </form>

                            <p className="text-center">
                                <span>Already have an account?</span>
                                <Link to="/tenant-login">
                                    <span> Sign in instead</span>
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantRegistration;
