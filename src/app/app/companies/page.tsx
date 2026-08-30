"use client";

import { useState } from "react";
import { Search, MapPin, Building2, ExternalLink, Star } from "lucide-react";

const COMPANIES = [
  {
    id: 1,
    name: "Multiplex",
    address: "1 Kent St, Sydney NSW 2000",
    rating: 4.5,
    roles: 12,
    type: "Commercial Construction",
    tags: ["Tier 1", "High-rise"],
  },
  {
    id: 2,
    name: "John Holland Group",
    address: "65 Pirrama Rd, Pyrmont NSW 2009",
    rating: 4.2,
    roles: 8,
    type: "Infrastructure",
    tags: ["Civil", "Rail"],
  },
  {
    id: 3,
    name: "CPB Contractors",
    address: "177 Pacific Hwy, North Sydney NSW 2060",
    rating: 4.0,
    roles: 15,
    type: "Civil Engineering",
    tags: ["Tier 1", "Roads"],
  },
  {
    id: 4,
    name: "Lendlease",
    address: "Barangaroo Ave, Barangaroo NSW 2000",
    rating: 4.4,
    roles: 22,
    type: "Property & Infrastructure",
    tags: ["Global", "Development"],
  },
  {
    id: 5,
    name: "Richard Crookes Constructions",
    address: "Level 3/4 Broadcast Way, Artarmon NSW 2064",
    rating: 4.1,
    roles: 5,
    type: "Private Construction",
    tags: ["Education", "Health"],
  }
];

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCompanies = COMPANIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 -mx-4 md:-mx-8 px-4 md:px-8">
      {/* Left Panel: Company List */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col h-full bg-bg-card border border-border-light rounded-2xl shadow-sm overflow-hidden shrink-0">
        
        {/* Search Header */}
        <div className="p-4 border-b border-border-light bg-bg-secondary shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search companies, types..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-light rounded-xl text-sm focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal transition-all"
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {filteredCompanies.length} Properties found
            </span>
            <button className="text-xs font-bold text-primary-teal hover:text-primary-teal-dark">
              Filters
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredCompanies.map(company => (
            <div key={company.id} className="group p-4 border border-border-light rounded-xl hover:border-primary-teal hover:shadow-md transition-all cursor-pointer bg-bg-main">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-text-heading text-lg group-hover:text-primary-teal transition-colors">{company.name}</h3>
                <div className="flex items-center bg-accent-orange/10 text-accent-orange px-2 py-1 rounded text-xs font-bold">
                  <Star size={12} className="mr-1 fill-accent-orange" />
                  {company.rating}
                </div>
              </div>
              
              <p className="text-sm text-text-muted mb-3 flex items-start">
                <MapPin size={14} className="mr-1.5 mt-0.5 shrink-0 text-primary-teal" />
                <span className="leading-tight">{company.address}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-1 bg-bg-secondary text-text-charcoal text-[11px] font-bold uppercase rounded-md border border-border-light">
                  {company.type}
                </span>
                {company.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-bg-hover text-text-muted text-[11px] font-bold uppercase rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border-light">
                <div className="flex items-center text-sm font-medium text-text-charcoal">
                  <Building2 size={16} className="mr-1.5 text-text-muted" />
                  {company.roles} Active Roles
                </div>
                <button className="text-primary-teal hover:text-primary-teal-dark p-1">
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Google Map */}
      <div className="hidden lg:block flex-1 h-full rounded-2xl overflow-hidden border border-border-light shadow-sm bg-bg-card relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d105994.88755675402!2d151.134598!3d-33.876523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1sconstruction%20companies!5e0!3m2!1sen!2sau!4v1710000000000!5m2!1sen!2sau"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 w-full h-full"
        ></iframe>
        
        {/* Floating Map Controls overlay mock */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors">
            <span className="font-bold text-xl leading-none">+</span>
          </button>
          <button className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors">
            <span className="font-bold text-2xl leading-none">-</span>
          </button>
        </div>
      </div>
    </div>
  );
}
