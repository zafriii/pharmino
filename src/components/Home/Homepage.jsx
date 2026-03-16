import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  Users,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Secure user management with customizable permissions for staff and administrators"
    },
    {
      icon: ShoppingCart,
      title: "POS System",
      description: "Fast and efficient point-of-sale with barcode scanning and invoice generation"
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels, expiry dates, and automate reordering with real-time inventory updates"
    },
    {
      icon: AlertTriangle,
      title: "Damage Records",
      description: "Maintain detailed records of damaged or expired products with loss tracking"
    },
    {
      icon: ShoppingBag,
      title: "Purchase Management",
      description: "Streamline supplier orders, track deliveries, and manage purchase history"
    },
    {
      icon: DollarSign,
      title: "Expense Management",
      description: "Monitor all pharmacy expenses, categorize costs, and generate financial reports"
    }
  ];

  const benefits = [
    "Reduce medication errors",
    "Save time with automated inventory alerts",
    "Increase profitability with expense tracking",
    "Ensure compliance with detailed record keeping"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-17 flex items-center">
                <img src='/images/pharmino-logo.png'
                 className="h-14 w-auto object-contain"
                 alt="Pharmino Logo"
                />
              </div>            
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#4a90e2] transition">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-[#4a90e2] transition">Benefits</a>
              <a href="#contact" className="text-gray-600 hover:text-[#4a90e2] transition">Contact</a>
              <Link
                href="/dashboard-overview"
                className="bg-[#4a90e2] text-white px-6 py-2 rounded-lg hover:bg-[#357abd] transition flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link
                href="/dashboard-overview"
                className="bg-[#4a90e2] text-white px-4 py-2 rounded-lg text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a90e2]/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="bg-[#4a90e2]/10 text-[#4a90e2] px-4 py-2 rounded-full text-sm font-semibold">
                  Complete Pharmacy Solution
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Manage Your Pharmacy with
                <span className="text-[#4a90e2]"> Pharmino</span>
              </h1>
              <p className="text-xl text-gray-600">
                Comprehensive pharmacy management system with inventory tracking, POS, expense management, and role-based access control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/dashboard-overview"
                  className="bg-[#4a90e2] text-white px-8 py-4 rounded-lg hover:bg-[#357abd] transition flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-lg font-semibold"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="border-2 border-[#4a90e2] text-[#4a90e2] px-8 py-4 rounded-lg hover:bg-[#4a90e2] hover:text-white transition text-lg font-semibold text-center"
                >
                  Learn More
                </a>
              </div>
            </div>


            <div className="relative hidden md:block">
              <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition duration-500">
                <img
                  src="/images/medicine.png"
                  alt="Pharmino Dashboard Preview"
                  className="w-full h-full object-cover"
                />
                {/* Optional overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4a90e2]/20 to-transparent"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your pharmacy efficiently and profitably
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition duration-300 group hover:border-[#4a90e2]"
              >
                <div className="w-14 h-14 bg-[#4a90e2]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#4a90e2] transition">
                  <feature.icon className="w-7 h-7 text-[#4a90e2] group-hover:text-white transition" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-[#4a90e2] to-[#357abd] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose Pharmino?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Built specifically for pharmacies in Bangladesh, Pharmino helps you manage every aspect of your business with ease.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
                    <p className="text-lg text-white/90">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href="/dashboard-overview"
                  className="inline-flex items-center space-x-2 bg-white text-[#4a90e2] px-8 py-4 rounded-lg hover:bg-gray-100 transition shadow-lg text-lg font-semibold"
                >
                  <span>Start Using Pharmino</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Secure & Reliable</h3>
                    <p className="text-white/80">Your data is protected with enterprise-grade security</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6">
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">99.9%</p>
                    <p className="text-sm text-white/80">Uptime</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">24/7</p>
                    <p className="text-sm text-white/80">Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Pharmacy?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of pharmacies already using Pharmino to streamline their operations
          </p>
          <Link
            href="/dashboard-overview"
            className="inline-flex items-center space-x-2 bg-[#4a90e2] text-white px-10 py-5 rounded-lg hover:bg-[#357abd] transition shadow-xl hover:shadow-2xl text-lg font-semibold"
          >
            <span>Access Dashboard Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-17 flex items-center">
                <img src='/images/pharmino-logo.png'
                 className="h-12 w-auto object-contain"
                 alt="Pharmino Logo"
                />
              </div>
              </div>
              <p className="text-gray-400 mb-4">
                Complete pharmacy management system for modern healthcare businesses
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-[#4a90e2] transition">Features</a></li>
                <li><a href="#benefits" className="hover:text-[#4a90e2] transition">Benefits</a></li>
                <li><Link href="/dashboard" className="hover:text-[#4a90e2] transition">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@pharmino.com</li>
                <li>Phone: +880 1XXX-XXXXXX</li>
                <li>Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Pharmino. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}