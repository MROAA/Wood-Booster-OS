import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentGenesisModule extends StatefulWidget {
  const DigitalEnvironmentGenesisModule({super.key});

  @override
  State<DigitalEnvironmentGenesisModule> createState() => _DigitalEnvironmentGenesisModuleState();
}

class _DigitalEnvironmentGenesisModuleState extends State<DigitalEnvironmentGenesisModule> {
  bool _genesisFieldActive = true;
  String _genesisStatus = 'Genesis-kenttä vakaa: Valmiina syntetisoimaan uusia digitaalisia todellisuuksia.';
  
  final List<Map<String, String>> _universeLog = [
    {'universe': 'Universe-Alpha-96', 'nodes': '1,024 solmua', 'stability': '99.8%'},
    {'universe': 'Nexus-Cyber-Space', 'nodes': '4,096 solmua', 'stability': '97.4%'},
    {'universe': 'Spacemonkey-Void-Core', 'nodes': '256 solmua', 'stability': '100.0%'},
  ];

  void _sparkNewUniverse() {
    setState(() {
      _genesisStatus = 'Käynnistetty alkupaukkaus (Big Bang): Uusi universumi syntetisoitu onnistuneesti.';
      _universeLog.insert(0, {
        'universe': 'Universe-Omega-26',
        'nodes': '8,192 solmua',
        'stability': '99.9%'
      });
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
              '🌌 Spacemonkey Neural Genesis & World Generator',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              _genesisFieldActive ? 'GENESIS PÄÄLLÄ' : 'VALMIUSTILA',
              style: TextStyle(color: _genesisFieldActive ? Colors.blue.withOpacity(0.9) : Colors.grey, fontSize: 11, fontFamily: 'monospace'),
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
            _genesisStatus,
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
              itemCount: _universeLog.length,
              itemBuilder: (context, index) {
                final univ = _universeLog[index];
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
                          Text(univ['universe']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Koko: ${univ['nodes']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        'Stabiilius: ${univ['stability']}',
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
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _sparkNewUniverse,
              child: const Text('Luo uusi universumi (Genesis Spark)'),
            ),
            ToggleSwitch(
              checked: _genesisFieldActive,
              content: const Text('Genesis-kenttä', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _genesisFieldActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
