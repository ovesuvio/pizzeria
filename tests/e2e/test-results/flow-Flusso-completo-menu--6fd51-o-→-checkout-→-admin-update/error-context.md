# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]: O Vesuvio
      - navigation [ref=e6]:
        - link "Home" [ref=e7] [cursor=pointer]:
          - /url: /
        - link "Menu" [ref=e8] [cursor=pointer]:
          - /url: /menu
        - link "Carrello" [active] [ref=e9] [cursor=pointer]:
          - /url: /cart
        - link "Profilo" [ref=e10] [cursor=pointer]:
          - /url: /profile
        - link "Storico ordini" [ref=e11] [cursor=pointer]:
          - /url: /orders
        - link "Admin" [ref=e12] [cursor=pointer]:
          - /url: /admin
    - main [ref=e13]:
      - generic [ref=e14]:
        - heading "Carrello" [level=2] [ref=e15]
        - paragraph [ref=e16]:
          - text: Il carrello è vuoto.
          - link "Vai al menu" [ref=e17] [cursor=pointer]:
            - /url: /menu
    - contentinfo [ref=e18]:
      - generic [ref=e19]: Manzenstraße 60, 73037 Göppingen • Tel. 07161-811727
      - generic [ref=e20]: Mer–Dom 17:00–22:00 • Lun–Mar chiuso
  - alert [ref=e21]: /cart
```