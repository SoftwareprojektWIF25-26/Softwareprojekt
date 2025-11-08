function getProjektListe(): Promise<{
  projekte: Projekte[];
}> {
  return request({
    url: '/api/projektliste',
  })
}
