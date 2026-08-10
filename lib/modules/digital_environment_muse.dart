import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';

class DigitalEnvironmentMuseModule extends StatefulWidget {
  const DigitalEnvironmentMuseModule({super.key});

  @override
  State<DigitalEnvironmentMuseModule> createState() => _DigitalEnvironmentMuseModuleState();
}

class _DigitalEnvironmentMuseModuleState extends State<DigitalEnvironmentMuseModule> {
  bool _creativeChaosActive = true;
  double _entropyCreativityIndex = 0.88;
  String _museStatus = 'Infinite Muse valmiina: Luova kaaos kanavoitu neuroverkkoon.';
  
  final List<Map<String, String>> _creativeSparks = [
    {'spark': 'Cyberpunk-runous kvantti-algoritmeista', 'origin': 'Kaaos-solmu #09', 'novelty': '98.5%'},
    {'spark': 'Retrofuturistinen arkkitehtuuri & fraktaalit', 'origin': 'Muisti-assosiaatio', 'novelty': '94.2%'},
    {'spark': 'Autonomisen tekoälyn jazz-improvisaatio', 'origin': 'Synteettinen uni', 'novelty': '99.1%'},
  ];

  void _sparkCreativeChaos() {
    setState(() {
      _entropyCreativityIndex = (_entropyCreativityIndex + 0.05).clamp(0.0, 1.0);
      _museStatus = 'Luova purkaus laukaistu: Uusi epälineaarinen oivallus syntetisoitu.';
      _creativeSparks.insert(0, {
        'spark': 'Dynaaminen kvantti-metafora Win96-kayttöliittymästä',
        'origin': 'Infinite Muse Engine',
        'novelty': '99.9%'
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
              '🎨 Spacemonkey Infinite Muse & Creative Chaos',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Luovuus: ${(_entropyCreativityIndex * 100).toStringAsFixed(1)}%',
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
          child: Text(
            _museStatus,
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
              itemCount: _creativeSparks.length,
              itemBuilder: (context, index) {
                final spark = _creativeSparks[index];
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
                          Text(spark['spark']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          Text('Lähde: ${spark['origin']}', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                        ],
                      ),
                      Text(
                        'Uutuus: ${spark['novelty']}',
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
              onPressed: _sparkCreativeChaos,
              child: const Text('Sytytä luova kaaos (Spark Muse)'),
            ),
            ToggleSwitch(
              checked: _creativeChaosActive,
              content: const Text('Luova kaaostila', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _creativeChaosActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
