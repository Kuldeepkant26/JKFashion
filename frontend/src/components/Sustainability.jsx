import React from 'react';
import '../css/Sustainability.css';
import { FaLeaf, FaRecycle, FaTint, FaSeedling } from 'react-icons/fa';

const Sustainability = () => {
  const items = [
    { title: 'Responsible Yarn', desc: 'Cotton and viscose sourced from suppliers who can document their chain.', icon: FaSeedling },
    { title: 'Water Discipline', desc: 'Processing water treated before discharge, with reuse wherever the process allows.', icon: FaTint },
    { title: 'Less Waste', desc: 'Nesting and repeat planning that cuts fabric wastage at the punching stage.', icon: FaRecycle },
    { title: 'Safer Chemistry', desc: 'Azo-free dyes and processing aids selected against buyer compliance lists.', icon: FaLeaf }
  ];

  return (
    <section className="sustainability-section">
      <div className="sustainability-container">
        <div className="sustainability-header">
          <span className="home-section-label">Sustainability</span>
          <h2 className="home-section-title">Made With Some Care For What It Costs</h2>
          <p className="sustainability-sub">Textile processing is water- and chemical-heavy work. These are the practices we hold ourselves to, and the ones buyers audit us against.</p>
        </div>
        <div className="sustainability-grid">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div key={i} className="sustain-card">
                <div className="sustain-icon">
                  <Icon />
                </div>
                <h4>{it.title}</h4>
                <p>{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Sustainability;
