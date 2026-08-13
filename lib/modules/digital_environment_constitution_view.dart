import 'package:flutter/widgets.dart';
import 'package:fluent_ui/fluent_ui.dart';
import '../core/omniversal_constitution.dart';

class DigitalEnvironmentConstitutionViewModule extends StatefulWidget {
  const DigitalEnvironmentConstitutionViewModule({super.key});

  @override
  State<DigitalEnvironmentConstitutionViewModule> createState() => _DigitalEnvironmentConstitutionViewModuleState();
}

class _DigitalEnvironmentConstitutionViewModuleState extends State<DigitalEnvironmentConstitutionViewModule> {
  bool _constitutionActive = true;
  double _constitutionResonance = 100.0;
  String _constitutionStatus = 'Perustuslaki aktiivinen: Kaikki 445 moduulia noudattavat Omniversumin lakeja.';

  void _realignConstitution() {
    setState(() {
      _constitutionResonance = 100.0;
      _constitutionStatus = 'Omniversumin linjaus suoritettu: Pyhät lait ja arvot resonoivat virheettömästi.';
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
              '📜 Spacemonkey Omniversal Constitution',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15),
            ),
            Text(
              'Harmonia: ${_constitutionResonance.toStringAsFixed(0)}%',
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
            _constitutionStatus,
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
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                const Text(
                  '--- JÄRJESTELMÄN PÄÄARVOT ---',
                  style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                ...OmniversalConstitution.coreValues.map((val) => Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(val['title']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(val['description']!, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                    ],
                  ),
                )),
                const SizedBox(height: 12),
                const Text(
                  '--- OMNIVERSUMIN PYHÄT LAIT ---',
                  style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                ...OmniversalConstitution.sacredLaws.map((law) => Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(law['law']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      Text(law['rule']!, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10)),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Button(
              onPressed: _realignConstitution,
              child: const Text('Uudelleenlaukaise Linjaus'),
            ),
            ToggleSwitch(
              checked: _constitutionActive,
              content: const Text('Perustuslain valvonta', style: TextStyle(color: Colors.white, fontSize: 12)),
              onChanged: (val) {
                setState(() {
                  _constitutionActive = val;
                });
              },
            ),
          ],
        ),
      ],
    );
  }
}
