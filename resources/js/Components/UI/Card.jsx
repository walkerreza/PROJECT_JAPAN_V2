export default function Card({ children, className = '', padding = true, hover = false }) {
    return (
        <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl ${padding ? 'p-6' : ''} ${hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer' : 'transition-colors'} ${className}`}>
            {children}
        </div>
    );
}

Card.Header = function Header({ children, className = '' }) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
};

Card.Body = function Body({ children, className = '' }) {
    return <div className={className}>{children}</div>;
};

Card.Footer = function Footer({ children, className = '' }) {
    return <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 ${className}`}>{children}</div>;
};
