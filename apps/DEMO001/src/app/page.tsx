/**
 * @template search-page
 * @version 4.1.0
 * @description Search/Home page template (Vite + React Router)
 *
 * Navigation: react-router-dom useNavigate
 * No 'use client' directive (Vite SPA)
 */
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import SearchForm, { SearchFormData } from '@/components/search/SearchForm';

export default function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (data: SearchFormData) => {
    // Compose URL parameters
    const params = new URLSearchParams();
    params.set('origin', data.origin.toUpperCase());
    params.set('destination', data.destination.toUpperCase());
    params.set('departureDate', data.departureDate);

    if (data.tripType === 'roundtrip' && data.returnDate) {
      params.set('returnDate', data.returnDate);
    }

    params.set('adults', data.passengers.adults.toString());
    params.set('children', data.passengers.children.toString());
    params.set('infants', data.passengers.infants.toString());
    params.set('cabinClass', data.cabinClass);
    params.set('tripType', data.tripType);

    // Save search data to sessionStorage for results page
    sessionStorage.setItem(
      'lastSearch',
      JSON.stringify({
        origin: data.origin.toUpperCase(),
        destination: data.destination.toUpperCase(),
        departureDate: data.departureDate,
        returnDate: data.returnDate,
        passengers: data.passengers,
        cabinClass: data.cabinClass,
        tripType: data.tripType,
        searchedAt: new Date().toISOString(),
      })
    );

    // Navigate to results page
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-secondary">
      <Header mode="default" />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-accent to-secondary py-16 px-4 sm:py-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative container mx-auto max-w-4xl">
            {/* Hero Text */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Where would you like to go?
              </h1>
              <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
                Find the best airfares. Real-time search across major carriers worldwide.
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-3xl mx-auto">
              <SearchForm onSearch={handleSearch} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1: Real-time Search */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background-secondary hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    search
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Real-time Search
                </h3>
                <p className="text-sm text-text-secondary">
                  Compare real-time fares from carriers worldwide at once
                </p>
              </div>

              {/* Feature 2: Best Price */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background-secondary hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-accent text-2xl">
                    payments
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Best Price Guaranteed
                </h3>
                <p className="text-sm text-text-secondary">
                  Book air tickets at transparent prices with no hidden fees
                </p>
              </div>

              {/* Feature 3: 24/7 Support */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background-secondary hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    support_agent
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  24/7 Customer Support
                </h3>
                <p className="text-sm text-text-secondary">
                  We help you anytime from booking to boarding
                </p>
              </div>

              {/* Sandbox Badge */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-amber-50 border border-amber-200 hover:shadow-card transition-shadow">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">
                    science
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-amber-700 mb-2">
                  Sandbox Environment
                </h3>
                <p className="text-sm text-amber-600">
                  This is a demo environment for testing purposes only
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom nav spacer (mobile) */}
      <div className="h-20 md:hidden" />

      <Footer />
    </div>
  );
}
