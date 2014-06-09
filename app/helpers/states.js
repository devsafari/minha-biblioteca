var brasilStates = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazona',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins'
}

brasilStatesRegions = [
  {
    region_name: 'Centro Oeste',
    states: [
      'GO',
      'MT',
      'MS',
      'DF'
    ]
  },
  {
    region_name: 'Nordeste',
    states: [
      'PB',
      'PI',
      'RN',
      'MA',
      'PE',
      'CE',
      'BA',
      'SE',
      'AL',
    ]
  },
  {
    region_name: 'Norte',
    states: [
      'RO',
      'RR',
      'AC',
      'PA',
      'AM',
      'AP',
      'TO'
    ]
  },
  {
    region_name: 'Sudeste',
    states: [
      'MG',
      'ES',
      'RJ',
      'SP',
    ]
  },
  {
    region_name: 'Sudeste',
    states:
    [
      'RS',
      'SC',
      'PR'
    ]
  }
]

module.exports = {
  states: brasilStates,
  regions: brasilStatesRegions
}