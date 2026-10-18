class CreateBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :bookings, id: :uuid do |t|
      t.references :event_type, type: :uuid, null: false, foreign_key: true
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :visitor_name, null: false
      t.string :visitor_email, null: false

      t.timestamps

      # Атомарная защита от гонки (issue #28): две брони на пересекающиеся
      # интервалы, независимо от Типа события, не могут существовать одновременно.
      t.exclusion_constraint "tsrange(starts_at, ends_at) WITH &&", using: :gist, name: "bookings_no_overlapping_slots"
    end
  end
end
