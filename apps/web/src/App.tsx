import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth.js';
import { LandingPage } from './pages/LandingPage.js';
import { SignInPage } from './pages/SignInPage.js';
import { SignUpPage } from './pages/SignUpPage.js';
import { HomePage } from './pages/HomePage.js';
import { CreateRoomPage } from './pages/CreateRoomPage.js';
import { JoinRoomPage } from './pages/JoinRoomPage.js';
import { LobbyPage } from './pages/LobbyPage.js';
import { GamePage } from './pages/GamePage.js';
import { ResultsPage } from './pages/ResultsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { RulesPage } from './pages/RulesPage.js';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/create" element={<CreateRoomPage />} />
            <Route path="/join" element={<JoinRoomPage />} />
            <Route path="/lobby/:gameId" element={<LobbyPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/results/:gameId" element={<ResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
