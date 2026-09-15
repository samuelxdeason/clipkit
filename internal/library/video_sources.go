package library

func (db *DB) VideoSources() ([]Video, error) {
	rows, err := db.sql.Query("SELECT site, id, COALESCE(webpage_url, '') FROM videos")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []Video
	for rows.Next() {
		var v Video
		if err := rows.Scan(&v.Site, &v.ID, &v.WebpageURL); err != nil {
			return nil, err
		}
		result = append(result, v)
	}
	return result, rows.Err()
}
