import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class HeadlessApiBridgeModule extends StatefulWidget {
  const HeadlessApiBridgeModule({super.key});

  @override
  State<HeadlessApiBridgeModule> createState() => _HeadlessApiBridgeModuleState();
}

class _HeadlessApiBridgeModuleState extends State<HeadlessApiBridgeModule> {
  bool _bridgeActive = true;
  String _bridgeStatus = 'API Bridge valmiina kuuntelemaan saapuvia pyyntöjä (Portti: 1996).';
  final List<String> _requestLogs = [
    '[API] GET /api/v1/win96/status -> 200 OK (0.12ms)',
    '[API] POST /api/v1/rag/query -> Payload processed successfully',
    '[API] WS /agent/stream -> Connected to remote telemetry node',
  ];

  void _simulateIncomingRequest() {
    setState(() {
      _bridgeStatus = 'Saapuva API-kutsu käsitelty: Ulkoinen etäagentti synkronoitu.';
      _requestLogs.insert(0, '[API] POST /api/v1/agent/sync -> 201 Created');
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
              '🌐 Headless API & Remote Agent Bridge',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _bridgeActive ? 'KUUNTELEE' : 'SULJETTU',
              style: TextStyle(color: _bridgeActive ? Colors.blue.withOpacity(0.9) : Colors.red, fontSize: 11, fontFamily: 'monospace'),
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
          child: Text(
            _bridgeStatus,
            style: TextStyle(color: Colors.blue.withOpacity(0.9), fontSize: 11, fontFamily: 'monospace'),
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
              itemCount: _requestLogs.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(
                    _requestLogs[index],
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _simulateIncomingRequest,
              child: const Text('Simuloi API-kutsu'),
            ),
            ToggleSwitch(
              checked: _bridgeActive,
              content: const Text('API Bridge aktiivinen', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _bridgeActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
