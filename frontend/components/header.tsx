import Link from "next/link";

export default function Navbar() {
    return (
        <header>
            <nav className="navbar-container" role="navigation" aria-label="main-navigation">
                <div>
                    <Link href="/">Bill Payments</Link>
            </div>
            <div className="menu">
                <ul>
                    <li>
                        <Link href="/">Home</Link>
                    </li>
                     <li>
                        <Link href="/invoices">Invoices</Link>
                    </li>
                     <li>
                        <Link href="/">Users</Link>
                    </li>
                     <li>
                        <Link href="/properties">Properties</Link>
                    </li>
                    <li>
                        <Link href="/vendors">Vendors</Link>
                    </li>
                    <li>
                        <Link href="/">payments</Link>
                    </li>
                    <li>
                        <Link href="/">Reports</Link>
                    </li>
                </ul>
            </div>
            <div className="nav-right">
                <button className="demo-booking">
                    Book a free demo
                </button>
                <a href="">Contact</a>
            </div>
        </nav>
</header>
    );
}
