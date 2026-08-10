import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentRagModule extends StatefulWidget {
  const DigitalEnvironmentRagModule({super.key});

  @override
  State<DigitalEnvironmentRagModule> createState() => _DigitalEnvironmentRagModuleState();
}

class _DigitalEnvironmentRagModuleState extends State<DigitalEnvironmentRagModule> {
  final List<Map<String, dynamic>> _vectorStore = [
    {'id': 'VEC-101', 'embedding': '[0.12, 0.45, 0.89]', 'content': 'Win96 Kernel Architecture & Boot Sequence', 'score': '0.94'},
    {'id': 'VEC-102', 'embedding': '[0.78, 0.22, 0.11]', 'content': 'Digital Space Telemetry & Packet Routing', 'score': '0.89'},
    {'id': 'VEC-103', 'embedding': '[0.55, 0.67, 0.33]', 'content': 'LLM Neural Weights & Adaptive Memory', 'score': '0.96'},
  ];

  String _ragQueryStatus = 'Valmiina suorittamaan semanttisen vektorianalyysin.';
  String _retrievedContext = 'Ei aktiivista hakukontekstia.';

  void _executeRagQuery() {
    setState(() {
      _ragQueryStatus = 'Haetaan vektorivarastosta kosinisuhteiden perusteella...';
      _retrievedContext = 'Löytyi osuvin kontekstipala: [VEC-103] LLM Neural Weights & Adaptive Memory (Score: 0.96)';
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) {
        setState(() {
          _ragQueryStatus = 'RAG-haku valmis: Konteksti syötetty onnistuneesti tekoälyn muistiin.';
        });
      }
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
              '🔍 AI RAG Vector Database & Semantic Engine',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Vektoreita: ${_vectorStore.length}',
              style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_ragQueryStatus, style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace')),
              const SizedBox(height: 6),
              Text(_retrievedContext, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
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
              itemCount: _vectorStore.length,
              itemBuilder: (context, index) {
                final vec = _vectorStore[index];
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
                          Text('[${vec['id']}] ${vec['content']}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Upotus: ${vec['embedding']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontFamily: 'monospace')),
                        ],
                      ),
                      Text(
                        'Pisteet: ${vec['score']}',
                        style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Button(
          onPressed: _executeRagQuery,
          child: const Text('Suorita RAG-haku (Semantic Query)'),
        ),
      ],
    );
  }
}
