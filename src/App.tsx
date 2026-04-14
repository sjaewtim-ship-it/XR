/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Member, View } from './types';
import { MOCK_MEMBERS } from './constants';
import MemberManagement from './components/MemberManagement';
import MemberDetails from './components/MemberDetails';
import PackagePurchase from './components/PackagePurchase';
import MemberHome from './components/MemberHome';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('management');
  const [selectedMember, setSelectedMember] = useState<Member>(MOCK_MEMBERS[0]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setCurrentView('details');
  };

  const handleBack = () => {
    setCurrentView('management');
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {currentView === 'management' && (
        <MemberManagement 
          onSelectMember={handleSelectMember} 
          onAddMember={() => setCurrentView('purchase')} 
        />
      )}
      {currentView === 'details' && (
        <MemberDetails 
          member={selectedMember} 
          onBack={handleBack} 
        />
      )}
      {currentView === 'purchase' && (
        <PackagePurchase 
          onBack={handleBack} 
        />
      )}
      {currentView === 'home' && (
        <MemberHome 
          member={selectedMember} 
          onBuyPackage={() => setCurrentView('purchase')} 
        />
      )}

      {/* View Switcher for Demo Purposes */}
      <div className="fixed bottom-4 left-4 flex gap-2 z-[100] bg-surface-highest/80 backdrop-blur-md p-2 rounded-lg border border-primary/20">
        <button 
          onClick={() => setCurrentView('management')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'management' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          商家端-列表
        </button>
        <button 
          onClick={() => setCurrentView('details')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'details' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          商家端-详情
        </button>
        <button 
          onClick={() => setCurrentView('purchase')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'purchase' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          用户端-购买
        </button>
        <button 
          onClick={() => setCurrentView('home')}
          className={`px-3 py-1 text-[10px] rounded ${currentView === 'home' ? 'bg-primary text-background' : 'text-primary'}`}
        >
          用户端-首页
        </button>
      </div>
    </div>
  );
}
