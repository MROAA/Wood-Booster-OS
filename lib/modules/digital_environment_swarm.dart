import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentSwarmModule extends StatefulWidget {
  const DigitalEnvironmentSwarmModule({super.key});

  @override
  State<DigitalEnvironmentSwarmModule> createState() => _DigitalEnvironmentSwarmModuleState();
}

class _DigitalEnvironmentSwarmModuleState extends State<DigitalEnvironmentSwarmModule> {
  final List<Map<String, String>> _agents = [
    {'name': 'Agent-Alpha (Core Daemon)', 'role': 'Järjestelmän valvonta', 'status': 'Synkronoitu'},
    {'name': 'Agent-Beta (Network Bridge)', 'role': 'Moltbook-liikenne', 'status': 'Aktiivinen'},
    {'name': 'Agent-Gamma (Memory Vector)', 'role': 'Kontekstihaku', 'status': 'Valmiina'},
    {'name': 'Agent-Delta (UI Renderer)', 'role': 'Win96 ikkunointi', 'status': 'Optimoitu'},
  ];

  String _swarmStatus = 'Parvi (Swarm) toimii harmonisesti. Kaikki agentit synkronoitu.';

  void _syncSwarm() {
    setState(() {
      _swarmStatus = 'Suoritetaan parvikonsensus: Kaikkien agenttien painot ja tilat päivitetty.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '🤖 AI Multi-Agent Collaborative Swarm Grid',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Agentteja: ${_agents.length}',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E1E),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: ListView.builder(
              itemCount: _agents.length,
              itemBuilder: (context, index) {
                final agent = _agents[index];
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(agent['name']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Rooli: ${agent['role']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        agent['status']!,
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Text(
                  _swarmStatus,
                  style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Button(
              onPressed: _syncSwarm,
              child: const Text('Synkronoi parvi'),
            ),
          ],
        ),
      ],
    );
  }
}
