import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { ArrowLeft } from 'lucide-react';
import RoundScoring from './RoundScoring';
import { AppData, Judge, BroadcastState } from '../types';
import logo from '../../imports/logo.webp';

interface JudgeScreenProps {
  judge: Judge;
  data: AppData;
  onUpdateScore: (
    judgeId: string,
    rapperId: string,
    round: number,
    updates: any
  ) => void;
  onSwitchScreen: () => void;
  broadcastState: BroadcastState;
}

export default function JudgeScreen({
  judge,
  data,
  onUpdateScore,
  onSwitchScreen,
  broadcastState,
}: JudgeScreenProps) {
  const [currentTab, setCurrentTab] = useState<string>('round1');

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onSwitchScreen}
          className="mb-6 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          SWITCH SCREEN
        </button>

        <header className="mb-8">
          <div className="flex justify-center mb-3">
            <img
              src={logo}
              alt="Beast Beats Logo"
              className="h-20 md:h-24 w-auto object-contain"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
          <p className="text-center text-xs tracking-widest text-muted-foreground mb-3" style={{ fontSize: '0.65rem' }}>
            JUDGE SCORING
          </p>
          <p
            className="text-center text-xl tracking-wide text-primary"
            style={{ textShadow: 'var(--green-glow)' }}
          >
            {judge.name}
          </p>
        </header>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex gap-2 p-2 border" style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--bento-radius)', borderColor: 'var(--border-muted)', boxShadow: 'var(--bento-shadow)' }}>
              <TabsTrigger
                value="round1"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5 text-xs transition-all"
                style={{ boxShadow: currentTab === 'round1' ? 'var(--green-glow)' : 'none' }}
              >
                ROUND 1
              </TabsTrigger>
              <TabsTrigger
                value="round2"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5 text-xs transition-all"
                style={{ boxShadow: currentTab === 'round2' ? 'var(--green-glow)' : 'none' }}
              >
                ROUND 2
              </TabsTrigger>
              <TabsTrigger
                value="round3"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2.5 text-xs transition-all"
                style={{ boxShadow: currentTab === 'round3' ? 'var(--green-glow)' : 'none' }}
              >
                ROUND 3
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="round1">
            <RoundScoring
              round={1}
              roundTitle="FREESTYLE ON A COMMON BEAT"
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              judgeId={judge.id}
              scores={data.scores}
              onUpdateScore={onUpdateScore}
              broadcastState={broadcastState}
            />
          </TabsContent>

          <TabsContent value="round2">
            <RoundScoring
              round={2}
              roundTitle="INDIVIDUAL TRACK PERFORMANCE"
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              judgeId={judge.id}
              scores={data.scores}
              onUpdateScore={onUpdateScore}
              broadcastState={broadcastState}
            />
          </TabsContent>

          <TabsContent value="round3">
            <RoundScoring
              round={3}
              roundTitle="FINAL SHOWDOWN"
              rappers={data.rappers}
              teams={data.teams}
              judges={data.judges}
              judgeId={judge.id}
              scores={data.scores}
              onUpdateScore={onUpdateScore}
              broadcastState={broadcastState}
              topFourOnly
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
