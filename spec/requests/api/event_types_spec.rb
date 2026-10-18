# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::EventTypes", type: :request do
  describe "POST /api/event-types" do
    describe "когда данные валидны" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "Короткий звонок на 15 минут",
          durationMinutes: 15
        }
      end

      it "возвращает 201" do
        expect(response).to have_http_status(:created)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 201)
      end

      it "возвращает созданный ресурс" do
        expect(response.parsed_body).to include(
          "title" => "Знакомство",
          "description" => "Короткий звонок на 15 минут",
          "durationMinutes" => 15
        )
      end

      it "генерирует id в виде uuid" do
        expect(response.parsed_body["id"]).to match(/\A[0-9a-f-]{36}\z/)
      end
    end

    describe "когда title пустой" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "",
          description: "Короткий звонок",
          durationMinutes: 15
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end

    describe "когда description пустой" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "",
          durationMinutes: 15
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end

    describe "когда durationMinutes меньше 1" do
      before do
        post "/api/event-types", as: :json, params: {
          title: "Знакомство",
          description: "Короткий звонок",
          durationMinutes: 0
        }
      end

      it "возвращает 422" do
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки validation" do
        expect(response.parsed_body["error"]["code"]).to eq("validation")
      end
    end
  end

  describe "GET /api/event-types" do
    before do
      EventType.create!(title: "Эфир", description: "Описание", duration_minutes: 30)
      EventType.create!(title: "Знакомство", description: "Описание", duration_minutes: 15)

      get "/api/event-types"
    end

    it "возвращает 200" do
      expect(response).to have_http_status(:ok)
    end

    it "соответствует контракту" do
      assert_api_conform(status: 200)
    end

    it "возвращает типы событий по алфавиту title" do
      expect(response.parsed_body.pluck("title")).to eq(%w[Знакомство Эфир])
    end
  end

  describe "GET /api/event-types/{id}/slots" do
    let(:event_type) { EventType.create!(title: "Знакомство", description: "Короткий звонок", duration_minutes: 30) }

    around { |example| travel_to(Time.utc(2026, 1, 1, 10, 5)) { example.run } }

    describe "когда id неизвестен" do
      before { get "/api/event-types/#{SecureRandom.uuid}/slots" }

      it "возвращает 404" do
        expect(response).to have_http_status(:not_found)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 404)
      end

      it "возвращает код ошибки not_found" do
        expect(response.parsed_body["error"]["code"]).to eq("not_found")
      end
    end

    describe "когда id не в формате uuid" do
      before { get "/api/event-types/not-a-uuid/slots" }

      it "возвращает 404" do
        expect(response).to have_http_status(:not_found)
      end

      it "возвращает код ошибки not_found" do
        expect(response.parsed_body["error"]["code"]).to eq("not_found")
      end
    end

    describe "когда бронирований нет" do
      before { get "/api/event-types/#{event_type.id}/slots" }

      it "возвращает 200" do
        expect(response).to have_http_status(:ok)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 200)
      end

      it "первый слот начинается на следующей границе сетки строго позже текущего момента" do
        expect(response.parsed_body.first).to eq(
          "startsAt" => "2026-01-01T10:30:00Z",
          "endsAt" => "2026-01-01T11:00:00Z"
        )
      end

      it "возвращает слоты по возрастанию startsAt" do
        starts_at = response.parsed_body.pluck("startsAt")
        expect(starts_at).to eq(starts_at.sort)
      end

      it "последний слот начинается до конца 13-го следующего календарного дня (UTC)" do
        expect(response.parsed_body.last["startsAt"]).to eq("2026-01-14T23:30:00Z")
      end
    end

    describe "когда слот пересекается с существующим бронированием любого типа события" do
      let(:other_event_type) { EventType.create!(title: "Эфир", description: "Описание", duration_minutes: 45) }

      before do
        # 45-минутная бронь в 10:30 закрывает и границу 10:30, и соседнюю 11:00.
        other_event_type.bookings.create!(
          starts_at: Time.utc(2026, 1, 1, 10, 30),
          visitor_name: "Гость",
          visitor_email: "guest@example.com"
        )

        get "/api/event-types/#{event_type.id}/slots"
      end

      it "не предлагает пересекающиеся слоты" do
        starts_at = response.parsed_body.pluck("startsAt")
        expect(starts_at).not_to include("2026-01-01T10:30:00Z", "2026-01-01T11:00:00Z")
      end

      it "предлагает следующий свободный слот" do
        starts_at = response.parsed_body.pluck("startsAt")
        expect(starts_at.first).to eq("2026-01-01T11:30:00Z")
      end
    end
  end
end
