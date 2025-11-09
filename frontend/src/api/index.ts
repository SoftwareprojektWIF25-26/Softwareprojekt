function getProjektListe(): Promise<{
  projekte: Projekte[];
}> {
  return request({
    url: '/api/projektliste',
    method: 'get',
  })
}


function getProjektById(id: number): Promise<{ projekt: Projekt }> {
  return request({
    url: `/api/projekte/${id}`,
    method: 'get',
  })
}

export default {
  getProjektListe,
  getProjektById
}
